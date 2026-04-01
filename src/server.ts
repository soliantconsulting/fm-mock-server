import { htmlResponse } from "@taxum/core/http";
import { m, Router } from "@taxum/core/routing";
import { serve } from "@taxum/core/server";
import { renderDocsHtml } from "./docs.js";
import { type Script, scriptHandlerProxy } from "./script.js";

type DocsOptions = {
    title: string;
    version?: string;
};

type Options = {
    scripts: Script[];
    port?: number;
    hostname?: string;
    docs?: DocsOptions;
};

export const runServer = async (options: Options) => {
    const router = new Router();

    for (const script of options.scripts) {
        router.route(
            `/fmi/odata/v4/test/Script.${script.name}`,
            m.post(scriptHandlerProxy(script)),
        );
    }

    if (options.docs) {
        const docsHtml = renderDocsHtml(options.scripts, options.docs);

        router.route(
            "/",
            m.get(() => htmlResponse(docsHtml)),
        );
    }

    await serve(router, {
        port: options.port,
        hostname: options.hostname,
        catchCtrlC: true,
        onListen: (address) => {
            console.info(`Server started on http://localhost:${address.port}`);
        },
    });

    process.exit(0);
};
