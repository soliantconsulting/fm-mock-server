# FM Mock Server

A mock server for FileMaker OData script calls. Define your script handlers with [Zod](https://zod.dev/) schemas, get automatic request/response validation, OpenAPI documentation via [Scalar](https://scalar.com/), and a dev server that mimics the FileMaker OData endpoint pattern.

## Installation

```sh
npm install @soliantconsulting/fm-mock-server
```

## Usage

```typescript
import { z } from "zod";
import { createScript, defaultFailureResponseSchema, runServer } from "@soliantconsulting/fm-mock-server";

const scripts = [
    createScript({
        name: "getUser",
        description: "Fetches a user by ID",
        tags: ["Users"],
        summary: "Get user",
        requestSchema: z.object({ userId: z.string() }),
        successResponseSchema: z.object({
            data: z.object({ id: z.string(), name: z.string() }),
        }),
        failureResponseSchema: defaultFailureResponseSchema.single,
    }).handler(async (request) => {
        // request is typed as { userId: string }
        return {
            data: { id: request.userId, name: "John Doe" },
        };
    }),
];

await runServer({
    scripts,
    port: 3000,
    docs: { title: "My API" },
});
```

Scripts are served at `/fmi/odata/v4/test/Script.<name>` and documentation is available at `/` when `docs` is provided.

## Defining Scripts

`createScript` accepts an options object and returns a builder with a `.handler()` method:

```typescript
createScript({
    name: "scriptName",              // FileMaker script name (required)
    description: "...",              // Description, shown in docs (required)
    tags: ["GroupName"],             // Tag grouping for docs (optional)
    summary: "...",                  // Short summary for sidebar (optional, defaults to description)
    requestSchema: z.object({...}), // Request schema (optional)
    successResponseSchema: z.object({...}),       // Success response schema (optional)
    failureResponseSchema: z.object({...}),       // Failure response schema (optional)
}).handler(async (request) => {
    // request is typed based on requestSchema
    // Return value is validated against successResponseSchema (or failureResponseSchema if defined)
    return { data: { ... } };
});
```

Both request and response schemas are used for runtime validation. Requests that don't match the schema return an error. Responses that don't match are caught during development.

## Error Responses

To allow a handler to return error responses, provide a `failureResponseSchema`. Without it, the handler can only return the success response type.

The library exports `defaultFailureResponseSchema` with two variants:

- `defaultFailureResponseSchema.single` — `{ error: { code, title, detail?, expose? } }`
- `defaultFailureResponseSchema.multi` — `{ errors: [{ code, title, detail?, expose? }] }`

```typescript
import { createScript, defaultFailureResponseSchema } from "@soliantconsulting/fm-mock-server";

createScript({
    name: "getUser",
    description: "Fetches a user by ID",
    successResponseSchema: z.object({
        data: z.object({ id: z.string(), name: z.string() }),
    }),
    failureResponseSchema: defaultFailureResponseSchema.single,
}).handler(async (request) => {
    // Return success...
    return { data: { id: "1", name: "John Doe" } };
    // ...or an error
    return {
        error: {
            code: "not_found",
            title: "Not Found",
            detail: "User not found",
            expose: true,
        },
    };
});
```

You can also define a fully custom failure response schema:

```typescript
createScript({
    name: "validate",
    description: "Validates input",
    requestSchema: z.object({ value: z.string() }),
    failureResponseSchema: z.object({
        errors: z.array(z.object({
            field: z.string(),
            message: z.string(),
        })),
    }),
}).handler(async (request) => {
    return { errors: [{ field: "value", message: "Too short" }] };
});
```

## OpenAPI Documentation

When `docs` is provided to `runServer`, an interactive API reference powered by Scalar is served at `/`. Scripts are documented as OpenAPI webhooks, with JSON schemas automatically generated from your Zod definitions.

You can also generate the spec or a standalone HTML docs page programmatically:

```typescript
import { buildOpenApiSpec, renderDocsHtml } from "@soliantconsulting/fm-mock-server";

// Get the OpenAPI spec object
const spec = buildOpenApiSpec(scripts, { title: "My API" });

// Generate a standalone HTML docs page (uses Scalar)
const html = renderDocsHtml(scripts, { title: "My API" });
```
