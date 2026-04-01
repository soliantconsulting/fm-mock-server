import { z } from "zod";
import { createScript, defaultFailureResponseSchema } from "../src/script.js";
import { runServer } from "../src/server.js";

const scripts = [
    createScript({
        name: "getUser",
        description: "Fetches a user by their ID",
        tags: ["Users"],
        summary: "Get user",
        requestSchema: z.object({
            userId: z.string().describe("The unique user identifier"),
        }),
        successResponseSchema: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
        }),
        failureResponseSchema: defaultFailureResponseSchema.single,
    }).handler(async (request) => {
        return { id: request.userId, name: "John Doe", email: "john@example.com" };
    }),

    createScript({
        name: "listUsers",
        description: "Lists all users with pagination",
        tags: ["Users"],
        summary: "List users",
        requestSchema: z.object({
            page: z.number().int().min(1).describe("Page number"),
            pageSize: z.number().int().min(1).max(100).describe("Items per page"),
        }),
        successResponseSchema: z.object({
            data: z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string(),
                }),
            ),
            meta: z.object({
                total: z.number().int(),
                page: z.number().int(),
                pageSize: z.number().int(),
            }),
        }),
    }).handler(async (request) => {
        return {
            data: [
                { id: "1", name: "John Doe", email: "john@example.com" },
                { id: "2", name: "Jane Doe", email: "jane@example.com" },
            ],
            meta: {
                total: 2,
                page: request.page,
                pageSize: request.pageSize,
            },
        };
    }),

    createScript({
        name: "createUser",
        description: "Creates a new user",
        tags: ["Users"],
        summary: "Create user",
        requestSchema: z.object({
            name: z.string().min(1).describe("Full name"),
            email: z.string().email().describe("Email address"),
        }),
        successResponseSchema: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
        }),
    }).handler(async (request) => {
        return { id: "new-id", name: request.name, email: request.email };
    }),

    createScript({
        name: "ping",
        description: "Simple health check endpoint",
        tags: ["System"],
        summary: "Health check",
    }).handler(async () => {
        // noop
    }),
];

await runServer({
    scripts,
    port: 3000,
    docs: { title: "FM Mock Server Demo", version: "3.0.0" },
});
