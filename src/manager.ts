import Router from "koa-tree-router";
import type { PathItemObject, SchemaObject } from "openapi3-ts/oas31";
import { type Script, buildScriptPathItemObject, scriptHandlerProxy } from "./script.js";

export class ScriptManager {
    private readonly scripts = new Map<string, Script>();

    public addScript(name: string, script: Script) {
        this.scripts.set(name, script);
    }

    /**
     * @internal
     */
    public createRouter(): Router {
        const router = new Router();

        for (const [name, script] of this.scripts.entries()) {
            router.post(`/fmi/odata/v4/test/Script.${name}`, scriptHandlerProxy(script.handler));
        }

        return router;
    }

    /**
     * @internal
     */
    public getScriptDefinitions(): Record<string, PathItemObject> {
        return Object.fromEntries(
            [...this.scripts.entries()].map(([name, script]) => [
                name,
                buildScriptPathItemObject(script.definition),
            ]),
        );
    }

    /**
     * @internal
     */
    public getSchemaDependencies(): Record<string, SchemaObject> {
        const schemaObjects: Record<string, SchemaObject> = {};

        for (const script of this.scripts.values()) {
            if (!script.schemaDependencies) {
                continue;
            }

            for (const [name, schema] of Object.entries(script.schemaDependencies)) {
                schemaObjects[name] = schema;
            }
        }

        return schemaObjects;
    }
}
