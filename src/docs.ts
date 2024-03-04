import path from "path";
import { mkdir, writeFile } from "fs/promises";
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
                                },
                                title: {
                                    type: "string",
                                    description:
                                        "Title of the error, should not change per error code",
                                },
                                detail: {
                                    type: "string",
                                    description: "Detailed description of the error",
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
