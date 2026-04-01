import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RequestBodyObject, ResponseObject, SchemaObject } from "openapi3-ts/oas31";
import { z } from "zod";
import { buildOpenApiSpec, renderDocsHtml } from "../src/docs.js";
import { createScript, defaultFailureResponseSchema } from "../src/script.js";

describe("buildOpenApiSpec", () => {
    it("generates spec with correct info", () => {
        const spec = buildOpenApiSpec([], { title: "Test API", version: "2.0.0" });

        assert.equal(spec.info.title, "Test API");
        assert.equal(spec.info.version, "2.0.0");
    });

    it("uses default version when not specified", () => {
        const spec = buildOpenApiSpec([], { title: "Test API" });

        assert.equal(spec.info.version, "1.0.0");
    });

    it("generates webhooks for scripts with request and response schemas", () => {
        const scripts = [
            createScript({
                name: "getUser",
                description: "Fetches a user",
                tags: ["users"],
                summary: "Get user",
                requestSchema: z.object({ userId: z.string() }),
                successResponseSchema: z.object({
                    data: z.object({ name: z.string(), email: z.string() }),
                }),
            }).handler(async (_request) => {
                return { data: { name: "John", email: "john@example.com" } };
            }),
        ];

        const spec = buildOpenApiSpec(scripts, { title: "Test API" });

        const pathItem = spec.webhooks?.getUser;
        assert.ok(pathItem?.post);
        assert.deepEqual(pathItem.post.tags, ["users"]);
        assert.ok(pathItem.post.description?.includes("Fetches a user"));
        assert.ok(pathItem.post.description?.includes("`getUser`"));
        assert.equal(pathItem.post.summary, "Get user");

        // Request body
        const requestBody = pathItem.post.requestBody as RequestBodyObject;
        const reqSchema = requestBody.content["application/json"].schema as SchemaObject;
        assert.equal(reqSchema.type, "object");
        assert.ok(reqSchema.required?.includes("userId"));

        // Response
        const okResponse = pathItem.post.responses?.["200"] as ResponseObject;
        assert.ok(okResponse);
        const resSchema = okResponse.content?.["application/json"]?.schema as SchemaObject;
        assert.equal(resSchema.type, "object");
        assert.ok(resSchema.required?.includes("data"));

        // No error response without failureResponseSchema
        assert.equal(pathItem.post.responses?.["400"], undefined);
    });

    it("generates 204 response for script without response schema", () => {
        const scripts = [
            createScript({
                name: "ping",
                description: "Health check",
            }).handler(async () => {
                // noop
            }),
        ];

        const spec = buildOpenApiSpec(scripts, { title: "Test API" });
        const pathItem = spec.webhooks?.ping;
        assert.ok(pathItem?.post);
        assert.equal(pathItem.post.summary, "Health check");
        assert.ok(pathItem.post.responses?.["204"]);
        assert.equal(pathItem.post.responses?.["200"], undefined);
    });

    it("omits request body for script without request schema", () => {
        const scripts = [
            createScript({
                name: "ping",
                description: "Health check",
            }).handler(async () => {
                // noop
            }),
        ];

        const spec = buildOpenApiSpec(scripts, { title: "Test API" });
        const pathItem = spec.webhooks?.ping;
        assert.ok(pathItem?.post);
        assert.equal(pathItem.post.requestBody, undefined);
    });

    it("generates 204 with failure response for script with only failureResponseSchema", () => {
        const scripts = [
            createScript({
                name: "doWork",
                description: "Does work",
                failureResponseSchema: defaultFailureResponseSchema.single,
            }).handler(async () => {
                // noop
            }),
        ];

        const spec = buildOpenApiSpec(scripts, { title: "Test API" });
        const pathItem = spec.webhooks?.doWork;
        assert.ok(pathItem?.post);
        assert.ok(pathItem.post.responses?.["204"]);
        assert.equal(pathItem.post.responses?.["200"], undefined);

        const errorResponse = pathItem.post.responses?.["400"] as ResponseObject;
        assert.ok(errorResponse);
    });

    it("includes error response when failureResponseSchema is defined", () => {
        const scripts = [
            createScript({
                name: "getUser",
                description: "Fetches a user",
                successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
                failureResponseSchema: defaultFailureResponseSchema.single,
            }).handler(async () => {
                return { data: { name: "John" } };
            }),
        ];

        const spec = buildOpenApiSpec(scripts, { title: "Test API" });
        const pathItem = spec.webhooks?.getUser;
        assert.ok(pathItem?.post);

        const errorResponse = pathItem.post.responses?.["400"] as ResponseObject;
        assert.ok(errorResponse);
        const schema = errorResponse.content?.["application/json"]?.schema as SchemaObject;
        assert.ok(schema.properties?.error);
        assert.deepEqual(schema.required, ["error"]);
    });
});

describe("renderDocsHtml", () => {
    it("renders a valid HTML page with spec and Scalar config", () => {
        const scripts = [
            createScript({
                name: "ping",
                description: "Health check",
            }).handler(async () => {
                // noop
            }),
        ];

        const html = renderDocsHtml(scripts, { title: "Test API", version: "1.0.0" });

        assert.ok(html.includes("<!DOCTYPE html>"));
        assert.ok(html.includes("<title>Test API</title>"));
        assert.ok(html.includes("api-reference"));
        assert.ok(html.includes("@scalar/api-reference"));
        assert.ok(html.includes("ping"));
    });
});
