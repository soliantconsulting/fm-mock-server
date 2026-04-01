import assert from "node:assert/strict";
import { text } from "node:stream/consumers";
import { describe, it } from "node:test";
import { HttpRequest, type HttpResponse, TO_HTTP_RESPONSE } from "@taxum/core/http";
import { z } from "zod";
import { createScript, defaultFailureResponseSchema, scriptHandlerProxy } from "../src/script.js";

const createJsonRequest = (body: unknown): HttpRequest => {
    return HttpRequest.builder()
        .method("POST")
        .header("content-type", "application/json")
        .body(JSON.stringify(body));
};

const resolveResponseBody = async (responseLike: unknown): Promise<unknown> => {
    const toResponse = responseLike as { [key: symbol]: () => HttpResponse };
    const response = toResponse[TO_HTTP_RESPONSE]();
    const bodyText = await text(response.body.readable);
    return JSON.parse(bodyText);
};

describe("createScript", () => {
    it("creates a script with no schemas", () => {
        const script = createScript({
            name: "ping",
            description: "Health check",
        }).handler(async () => {
            // noop
        });

        assert.equal(script.name, "ping");
        assert.equal(script.description, "Health check");
        assert.equal(script.requestSchema, undefined);
        assert.equal(script.successResponseSchema, undefined);
        assert.equal(script.failureResponseSchema, undefined);
    });

    it("creates a script with all schemas", () => {
        const script = createScript({
            name: "getUser",
            description: "Get a user",
            tags: ["users"],
            summary: "Fetches user by ID",
            requestSchema: z.object({ userId: z.string() }),
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
            failureResponseSchema: defaultFailureResponseSchema.single,
        }).handler(async (_request) => {
            return { data: { name: "John" } };
        });

        assert.equal(script.name, "getUser");
        assert.deepEqual(script.tags, ["users"]);
        assert.equal(script.summary, "Fetches user by ID");
        assert.ok(script.requestSchema);
        assert.ok(script.successResponseSchema);
        assert.ok(script.failureResponseSchema);
    });
});

describe("scriptHandlerProxy", () => {
    it("handles request with no schemas", async () => {
        const script = createScript({
            name: "ping",
            description: "Health check",
        }).handler(async () => {
            // noop
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: { code: 0, resultParameter: "" },
        });
    });

    it("validates and passes request data to handler", async () => {
        let receivedRequest: unknown;

        const script = createScript({
            name: "test",
            description: "Test",
            requestSchema: z.object({ userId: z.string() }),
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
        }).handler(async (request) => {
            receivedRequest = request;
            return { data: { name: "John" } };
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({
            scriptParameterValue: { userId: "123" },
        });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(receivedRequest, { userId: "123" });
        assert.deepEqual(body, {
            scriptResult: {
                code: 0,
                resultParameter: JSON.stringify({ data: { name: "John" } }),
            },
        });
    });

    it("returns error on invalid request data", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            requestSchema: z.object({ userId: z.string() }),
        }).handler(async () => {
            // noop
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({
            scriptParameterValue: { userId: 123 },
        });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: { code: 1, resultParameter: "" },
        });
    });

    it("wraps handler error response in scriptResult", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
            failureResponseSchema: defaultFailureResponseSchema.single,
        }).handler(async () => {
            return { error: { code: "not_found", title: "Not Found" } };
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: {
                code: 0,
                resultParameter: JSON.stringify({
                    error: { code: "not_found", title: "Not Found" },
                }),
            },
        });
    });

    it("returns code 1 when response fails validation", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
        }).handler(async () => {
            return { data: { name: 123 } } as never;
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: { code: 1, resultParameter: "" },
        });
    });

    it("returns code 1 when error response fails validation", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
            failureResponseSchema: defaultFailureResponseSchema.single,
        }).handler(async () => {
            // Return invalid error (missing title)
            return { error: { code: "fail" } } as never;
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: { code: 1, resultParameter: "" },
        });
    });

    it("returns code 1 when handler throws", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
        }).handler(async () => {
            throw new Error("unexpected");
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: { code: 1, resultParameter: "" },
        });
    });

    it("validates failure response when only failureResponseSchema is defined", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            failureResponseSchema: defaultFailureResponseSchema.single,
        }).handler(async () => {
            return { error: { code: "fail", title: "Failed" } };
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        assert.deepEqual(body, {
            scriptResult: {
                code: 0,
                resultParameter: JSON.stringify({
                    error: { code: "fail", title: "Failed" },
                }),
            },
        });
    });

    it("rejects error response when no failureResponseSchema is defined", async () => {
        const script = createScript({
            name: "test",
            description: "Test",
            successResponseSchema: z.object({ data: z.object({ name: z.string() }) }),
        }).handler(async () => {
            return { error: { code: "fail", title: "Failed" } } as never;
        });

        const handler = scriptHandlerProxy(script);
        const request = createJsonRequest({ scriptParameterValue: null });
        const response = await handler(request);
        const body = await resolveResponseBody(response);

        // Should fail validation against successResponseSchema
        assert.deepEqual(body, {
            scriptResult: { code: 1, resultParameter: "" },
        });
    });
});
