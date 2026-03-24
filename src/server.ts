import { htmlResponse } from "@taxum/core/http";
import { m } from "@taxum/core/routing";
import { serve } from "@taxum/core/server";
import type { ResponseObject } from "openapi3-ts/oas31";
import { buildOpenApiSpec } from "./docs.js";
import type { ScriptManager } from "./manager.js";

type DocsOptions = {
    title: string;
    version?: string;
    errorResponse?: ResponseObject;
};

type Options = {
    scriptManager: ScriptManager;
    port?: number;
    hostname?: string;
    docs?: DocsOptions;
};

export const runServer = async (options: Options) => {
    const router = options.scriptManager.createRouter();

    if (options.docs) {
        const specs = buildOpenApiSpec(options.scriptManager, {
            title: options.docs.title,
            version: options.docs.version,
            errorResponse: options.docs.errorResponse,
        });
        const specsJson = JSON.stringify(specs);

        const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>${specs.info.title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script type="application/json" id="openapi-spec">${specsJson}</script>
    <script type="application/javascript">
        const openApiSpec = JSON.parse(document.getElementById('openapi-spec').textContent);
        Redoc.init(openApiSpec, {}, document.body);
    </script>
  </body>
</html>
`;

        router.route(
            "/",
            m.get(() => htmlResponse(redocHtml)),
        );
    }

    await serve(router, {
        port: options.port,
        hostname: options.hostname,
        catchCtrlC: true,
        onListen: (address) => {
            console.info(`Server started on ${JSON.stringify(address)}`);
        },
    });

    process.exit(0);
};
