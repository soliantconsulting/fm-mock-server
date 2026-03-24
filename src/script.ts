import { json } from "@taxum/core/extract";
import { type HttpRequest, jsonResponse } from "@taxum/core/http";
import type { Handler } from "@taxum/core/routing";
import type { PathItemObject, ReferenceObject, SchemaObject } from "openapi3-ts/oas31";
import { z } from "zod";

export type ScriptHandler<T> = (parameter: T) => Promise<ScriptHandlerResult>;

export type ScriptDefinition = {
    tags?: string[];
    description: string;
    summary?: string;
    requestSchema: SchemaObject | ReferenceObject;
    responseSchema?: SchemaObject | ReferenceObject;
    metaSchema?: SchemaObject | ReferenceObject;
};

export type Script<T = unknown> = {
    handler: ScriptHandler<T>;
    definition: ScriptDefinition;
    schemaDependencies?: Record<string, SchemaObject>;
};

export type ScriptHandlerResult =
    | {
          data?: unknown;
          meta?: unknown;
      }
    | {
          errors: {
              code: string;
              title: string;
              detail?: string;
              expose?: boolean;
          }[];
      };

const bodySchema = z.object({
    scriptParameterValue: z.unknown(),
});

const jsonExtractor = json(bodySchema);

export const scriptHandlerProxy =
    (scriptHandler: ScriptHandler<unknown>): Handler =>
    async (request: HttpRequest) => {
        const body = await jsonExtractor(request);
        const bodyParseResult = bodySchema.safeParse(body);

        if (!bodyParseResult.success) {
            console.error(bodyParseResult.error);
            return jsonResponse({ scriptResult: { code: 1, resultParameter: "" } });
        }

        let scriptResult: ScriptHandlerResult;

        try {
            scriptResult = await scriptHandler(bodyParseResult.data.scriptParameterValue);
        } catch (error) {
            console.error(error);
            return jsonResponse({ scriptResult: { code: 1, resultParameter: "" } });
        }

        return jsonResponse({
            scriptResult: {
                code: 0,
                resultParameter: JSON.stringify(scriptResult),
            },
        });
    };

export const buildScriptPathItemObject = (definition: ScriptDefinition): PathItemObject => {
    return {
        post: {
            tags: definition.tags,
            description: definition.description,
            summary: definition.summary,
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
                                    meta: definition.metaSchema,
                                },
                                required: definition.metaSchema ? ["data", "meta"] : ["data"],
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
