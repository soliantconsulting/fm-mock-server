import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type OpenAPIObject, OpenApiBuilder, type ResponseObject } from "openapi3-ts/oas31";
import type { ScriptManager } from "./manager.js";

type BuildOptions = {
    title: string;
    version?: string;
    errorResponse?: ResponseObject;
};

type RenderOptions = BuildOptions & {
    outputPath: string;
    scriptManager: ScriptManager;
};

const defaultErrorResponse: ResponseObject = {
    description: "Generic error response",
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    errors: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    description: "Machine readable snake_case code",
                                    minLength: 1,
                                },
                                title: {
                                    type: "string",
                                    description:
                                        "Title of the error, should not change per error code",
                                    minLength: 1,
                                },
                                detail: {
                                    type: "string",
                                    description: "Detailed description of the error",
                                    minLength: 1,
                                },
                                expose: {
                                    type: "boolean",
                                    description: "Whether to expose the error to the end-user",
                                    default: false,
                                },
                            },
                            required: ["code", "title"],
                        },
                        minItems: 1,
                    },
                },
                required: ["errors"],
            },
        },
    },
};

export const buildOpenApiSpec = (
    scriptManager: ScriptManager,
    options: BuildOptions,
): OpenAPIObject => {
    const builder = new OpenApiBuilder();

    builder.addInfo({
        title: options.title,
        version: options.version ?? "1.0.0",
    });

    builder.addServer({
        url: "script: ",
    });

    builder.addResponse("GenericError", options.errorResponse ?? defaultErrorResponse);

    const scriptDefinitions = scriptManager.getScriptDefinitions();
    const schemaDependencies = scriptManager.getSchemaDependencies();

    for (const [name, pathItemObject] of Object.entries(scriptDefinitions)) {
        builder.addPath(name, pathItemObject);
    }

    for (const [name, schemaObject] of Object.entries(schemaDependencies)) {
        builder.addSchema(name, schemaObject);
    }

    return builder.getSpec();
};

export const renderDocs = async (options: RenderOptions): Promise<void> => {
    const builder = new OpenApiBuilder(buildOpenApiSpec(options.scriptManager, options));
    const spec = builder.getSpecAsYaml();

    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, spec);
};
