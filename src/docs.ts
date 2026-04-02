import { escapeHTML } from "fast-escape-html";
import {
    type OpenAPIObject,
    OpenApiBuilder,
    type PathItemObject,
    type SchemaObject,
} from "openapi3-ts/oas31";
import { z } from "zod";
import type { Script } from "./script.js";

type BuildOptions = {
    title: string;
    version?: string;
};

const buildScriptWebhookObject = (script: Script): PathItemObject => {
    const requestSchema = script.requestSchema
        ? (z.toJSONSchema(script.requestSchema) as SchemaObject)
        : undefined;
    const successResponseSchema = script.successResponseSchema
        ? (z.toJSONSchema(script.successResponseSchema) as SchemaObject)
        : undefined;
    const failureResponseSchema = script.failureResponseSchema
        ? (z.toJSONSchema(script.failureResponseSchema) as SchemaObject)
        : undefined;

    const summary = script.summary ?? script.description;
    const description = `**Script name:** \`${script.name}\`\n\n${script.description}`;

    return {
        post: {
            tags: script.tags,
            description,
            summary,
            ...(requestSchema
                ? {
                      requestBody: {
                          required: true,
                          content: {
                              "application/json": {
                                  schema: requestSchema,
                              },
                          },
                      },
                  }
                : {}),
            responses: {
                ...(successResponseSchema
                    ? {
                          "200": {
                              description: "Successful response",
                              content: {
                                  "application/json": {
                                      schema: successResponseSchema,
                                  },
                              },
                          },
                      }
                    : {
                          "204": {
                              description: "No content",
                          },
                      }),
                ...(failureResponseSchema
                    ? {
                          "400": {
                              description: "Failure response",
                              content: {
                                  "application/json": {
                                      schema: failureResponseSchema,
                                  },
                              },
                          },
                      }
                    : {}),
            },
        },
    };
};

export const buildOpenApiSpec = (scripts: Script[], options: BuildOptions): OpenAPIObject => {
    const builder = new OpenApiBuilder();

    builder.addInfo({
        title: options.title,
        version: options.version ?? "1.0.0",
    });

    for (const script of scripts) {
        builder.addWebhook(script.name, buildScriptWebhookObject(script));
    }

    return builder.getSpec();
};

const scalarConfig = {
    hideClientButton: true,
    hideTestRequestButton: true,
    hiddenClients: true,
    defaultOpenAllTags: true,
    agent: { disabled: true },
    mcp: { disabled: true },
    telemetry: false,
};

export const renderDocsHtml = (scripts: Script[], options: BuildOptions): string => {
    const spec = buildOpenApiSpec(scripts, options);

    return `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHTML(spec.info.title)}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      .section-column:has(.scalar-reference-intro-server) { display: none !important; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-configuration="${escapeHTML(JSON.stringify(scalarConfig))}" type="application/json">${JSON.stringify(spec).replaceAll("</", "<\\/")}</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`;
};
