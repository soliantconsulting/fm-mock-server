import gracefulShutdown from "http-graceful-shutdown";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import type { ScriptManager } from "./manager.js";

type Options = {
    scriptManager: ScriptManager;
    port?: number;
    hostname?: string;
};

export const runServer = (options: Options) => {
    const app = new Koa();
    app.use(bodyParser());

    const router = options.scriptManager.createRouter();
    app.use(router.routes());

    const server = app.listen(options.port, options.hostname, undefined, () => {
        console.info(`Server started on ${JSON.stringify(server.address())}`);
    });

    gracefulShutdown(server);
};
