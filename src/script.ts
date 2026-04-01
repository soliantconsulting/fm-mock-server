import { json } from "@taxum/core/extract";
import { type HttpRequest, jsonResponse } from "@taxum/core/http";
import type { Handler } from "@taxum/core/routing";
import { type ZodType, z } from "zod";

export const defaultErrorObjectSchema = z.object({
    code: z.string().min(1).describe("Machine readable snake_case code"),
    title: z.string().min(1).describe("Title of the error, should not change per error code"),
    detail: z.string().min(1).optional().describe("Detailed description of the error"),
    expose: z.boolean().optional().describe("Whether to expose the error to the end-user"),
});

export type ErrorObject = z.output<typeof defaultErrorObjectSchema>;

const singleFailureSchema = z.object({ error: defaultErrorObjectSchema });
const multiFailureSchema = z.object({ errors: z.array(defaultErrorObjectSchema) });

export type SingleFailureResponse = z.output<typeof singleFailureSchema>;
export type MultiFailureResponse = z.output<typeof multiFailureSchema>;

export const defaultFailureResponseSchema = {
    single: singleFailureSchema,
    multi: multiFailureSchema,
};

type HandlerRequest<T extends ZodType | undefined> = T extends ZodType ? z.output<T> : undefined;

type HandlerResult<
    TSuccess extends ZodType | undefined,
    TFailure extends ZodType | undefined,
> = TSuccess extends ZodType
    ? TFailure extends ZodType
        ? z.output<TSuccess> | z.output<TFailure>
        : z.output<TSuccess>
    : TFailure extends ZodType
      ? // biome-ignore lint/suspicious/noConfusingVoidType: void is correct here for handler return type
        z.output<TFailure> | void
      : // biome-ignore lint/suspicious/noConfusingVoidType: void is correct here for handler return type
        void;

type ScriptHandler<
    TRequest extends ZodType | undefined,
    TSuccess extends ZodType | undefined,
    TFailure extends ZodType | undefined,
> = (request: HandlerRequest<TRequest>) => Promise<HandlerResult<TSuccess, TFailure>>;

type CreateScriptOptions<
    TRequest extends ZodType | undefined = undefined,
    TSuccess extends ZodType | undefined = undefined,
    TFailure extends ZodType | undefined = undefined,
> = {
    name: string;
    description: string;
    tags?: string[];
    summary?: string;
    requestSchema?: TRequest;
    successResponseSchema?: TSuccess;
    failureResponseSchema?: TFailure;
};

type ScriptBuilder<
    TRequest extends ZodType | undefined,
    TSuccess extends ZodType | undefined,
    TFailure extends ZodType | undefined,
> = {
    handler: (handler: ScriptHandler<TRequest, TSuccess, TFailure>) => Script;
};

export type Script = {
    name: string;
    description: string;
    tags?: string[];
    summary?: string;
    requestSchema?: ZodType;
    successResponseSchema?: ZodType;
    failureResponseSchema?: ZodType;
    handler: (request: unknown) => Promise<unknown>;
};

export const createScript = <
    TRequest extends ZodType | undefined = undefined,
    TSuccess extends ZodType | undefined = undefined,
    TFailure extends ZodType | undefined = undefined,
>(
    options: CreateScriptOptions<TRequest, TSuccess, TFailure>,
): ScriptBuilder<TRequest, TSuccess, TFailure> => {
    return {
        handler(handler) {
            return {
                name: options.name,
                description: options.description,
                tags: options.tags,
                summary: options.summary,
                requestSchema: options.requestSchema,
                successResponseSchema: options.successResponseSchema,
                failureResponseSchema: options.failureResponseSchema,
                handler: handler as Script["handler"],
            };
        },
    };
};

const bodySchema = z.object({
    scriptParameterValue: z.unknown(),
});

const jsonExtractor = json(bodySchema);

const errorResult = () => jsonResponse({ scriptResult: { code: 1, resultParameter: "" } });

const validateSchema = (
    scriptName: string,
    label: string,
    schema: ZodType,
    value: unknown,
): { success: true; value: unknown } | { success: false } => {
    const result = schema.safeParse(value);

    if (!result.success) {
        console.error(`[${scriptName}] ${label} validation failed:`, result.error);
        return { success: false };
    }

    return { success: true, value: result.data };
};

const buildResponseSchema = (script: Script): ZodType | undefined => {
    if (script.successResponseSchema && script.failureResponseSchema) {
        return script.successResponseSchema.or(script.failureResponseSchema);
    }

    return script.successResponseSchema ?? script.failureResponseSchema;
};

const executeHandler = async (
    script: Script,
    handlerInput: unknown,
): Promise<{ success: true; result: unknown } | { success: false }> => {
    let result: unknown;

    try {
        result = await script.handler(handlerInput);
    } catch (error) {
        console.error(`[${script.name}] Handler threw an error:`, error);
        return { success: false };
    }

    const combinedSchema = buildResponseSchema(script);

    if (combinedSchema) {
        const validated = validateSchema(script.name, "Response", combinedSchema, result);

        if (!validated.success) {
            return { success: false };
        }

        return { success: true, result: validated.value };
    }

    return { success: true, result };
};

export const scriptHandlerProxy =
    (script: Script): Handler =>
    async (request: HttpRequest) => {
        let body: { scriptParameterValue: unknown };

        try {
            body = await jsonExtractor(request);
        } catch (error) {
            console.error(`[${script.name}] Body parsing failed:`, error);
            return errorResult();
        }

        let handlerInput: unknown;

        if (script.requestSchema) {
            const parsed = validateSchema(
                script.name,
                "Request",
                script.requestSchema,
                body.scriptParameterValue,
            );

            if (!parsed.success) {
                return errorResult();
            }

            handlerInput = parsed.value;
        }

        const executed = await executeHandler(script, handlerInput);

        if (!executed.success) {
            return errorResult();
        }

        return jsonResponse({
            scriptResult: {
                code: 0,
                resultParameter:
                    executed.result !== undefined ? JSON.stringify(executed.result) : "",
            },
        });
    };
