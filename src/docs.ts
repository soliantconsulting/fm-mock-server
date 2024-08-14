import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { OpenApiBuilder, type ResponseObject } from "openapi3-ts/oas31";
import type { ScriptManager } from "./manager.js";

type Options = {
    outputPath: string;
    scriptManager: ScriptManager;
    title: string;
    version?: string;
    errorResponse?: ResponseObject;
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

export const renderDocs = async (options: Options): Promise<void> => {
    const builder = new OpenApiBuilder();

    builder.addInfo({
        title: options.title,
        version: options.version ?? "1.0.0",
    });

    builder.addServer({
        url: "script-name: ",
    });

    builder.addResponse("GenericError", options.errorResponse ?? defaultErrorResponse);

    const scriptDefinitions = options.scriptManager.getScriptDefinitions();
    const schemaDependencies = options.scriptManager.getSchemaDependencies();

    for (const [name, pathItemObject] of Object.entries(scriptDefinitions)) {
        builder.addPath(name, pathItemObject);
    }

    for (const [name, schemaObject] of Object.entries(schemaDependencies)) {
        builder.addSchema(name, schemaObject);
    }

    const spec = builder.getSpecAsYaml();

    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, spec);
};
