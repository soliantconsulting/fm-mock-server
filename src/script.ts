import type { RouterContext } from "koa-tree-router";
import type { PathItemObject, SchemaObject } from "openapi3-ts/oas31";
import { z } from "zod";

export type ScriptHandler<T> = (parameter: T) => Promise<ScriptHandlerResult>;

export type ScriptDefinition = {
    description: string;
    requestSchema: SchemaObject;
    responseSchema: SchemaObject;
};

export type Script<T = unknown> = {
    handler: ScriptHandler<T>;
    definition: ScriptDefinition;
    schemaDependencies?: Record<string, SchemaObject>;
};

export type ScriptHandlerResult =
    | {
          data: unknown;
      }
    | {
          errors: {
              code: string;
              title: string;
              detail?: string;
          }[];
      };

const bodySchema = z.object({
    scriptParameterValue: z.unknown(),
});

export const scriptHandlerProxy =
    (scriptHandler: ScriptHandler<unknown>) =>
    async (context: RouterContext): Promise<void> => {
        const bodyParseResult = bodySchema.safeParse(context.request.body);

        if (!bodyParseResult.success) {
            console.error(bodyParseResult.error);
            context.body = { scriptResult: { code: 1, resultParameter: "" } };
            return;
        }

        let scriptResult: ScriptHandlerResult;

        try {
            scriptResult = await scriptHandler(bodyParseResult.data.scriptParameterValue);
        } catch (error) {
            console.error(error);
            context.body = { scriptResult: { code: 1, resultParameter: "" } };
            return;
        }

        context.body = {
            scriptResult: {
                code: 0,
                resultParameter: JSON.stringify(scriptResult),
            },
        };
    };

export const buildScriptPathItemObject = (definition: ScriptDefinition): PathItemObject => {
    return {
        post: {
            description: definition.description,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: definition.requestSchema,
                    },
                },
            },
            responses: {
                "200": {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: definition.responseSchema,
                                },
                                required: ["data"],
                            },
                        },
                    },
                },
                "400": {
                    $ref: "#/components/responses/GenericError",
                },
            },
        },
    };
};
