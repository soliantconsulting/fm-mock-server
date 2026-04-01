# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mock server library for FileMaker OData script calls. Published as `@soliantconsulting/fm-mock-server` on npm. Consumers define scripts with Zod schemas via `createScript()`, collect them in an array, and call `runServer()` to start an HTTP server that mimics the FileMaker OData endpoint pattern (`/fmi/odata/v4/test/Script.<name>`).

## Commands

- **Build:** `pnpm build` (runs `tsc -p tsconfig.build.json`, outputs to `dist/`)
- **Test:** `pnpm test` (runs `tsx --test test/**/*.test.ts`)
- **Single test file:** `npx tsx --test test/script.test.ts`
- **Format:** `pnpm format` (Biome formatter)
- **Lint + fix:** `pnpm check` (Biome linter with auto-fix)
- **Typecheck:** `pnpm exec tsc --noEmit` (uses `tsconfig.json` which includes src, test, and demo)
- **Demo:** `pnpm demo` (starts a dev server on port 3000 with Scalar docs)

## Code Style

- Uses Biome (not ESLint/Prettier) for linting and formatting
- 4-space indentation, 100-char line width
- Array types use shorthand syntax (`string[]` not `Array<string>`)
- Block statements required (no braceless `if`)
- No `console.log` — use `console.error`, `console.info`, `console.warn`, `console.debug`
- No unused imports or inferrable type annotations
- Commits follow Conventional Commits (enforced by commitlint via lefthook)

## Architecture

- **`createScript`** (`script.ts`): Builder function. Accepts options with `requestSchema`, `successResponseSchema`, and optional `failureResponseSchema` (all Zod types), returns a builder with `.handler()` for type-safe handler definition. Request and response validation happens at runtime. Exports `defaultFailureResponseSchema` with `.single` and `.multi` variants.
- **`buildOpenApiSpec` / `renderDocsHtml`** (`docs.ts`): Generates an OpenAPI 3.1 spec using webhooks (not paths). `renderDocsHtml` produces a standalone Scalar HTML page. JSON schemas are auto-generated from Zod via `z.toJSONSchema()`. Error responses are shown per-script when `failureResponseSchema` is defined.
- **`runServer`** (`server.ts`): Takes a `Script[]`, builds a Taxum router with POST routes for each, optionally serves Scalar docs at `/`, starts the HTTP server.

The HTTP layer uses **Taxum** (`@taxum/core`), not Express/Koa.

## TypeScript Config

- `tsconfig.json`: Dev config — includes `src`, `test`, and `demo`. No emit.
- `tsconfig.build.json`: Build config — includes only `src`, emits to `dist/` with declarations.
