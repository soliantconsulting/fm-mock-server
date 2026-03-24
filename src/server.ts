import { serve } from "@taxum/core/server";
import type { ScriptManager } from "./manager.js";

type Options = {
    scriptManager: ScriptManager;
    port?: number;
    hostname?: string;
};

export const runServer = async (options: Options) => {
    const router = options.scriptManager.createRouter();

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
