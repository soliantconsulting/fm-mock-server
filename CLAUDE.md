# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mock server library for FileMaker OData script calls. Published as `@soliantconsulting/fm-mock-server` on npm. Consumers register script handlers via a `ScriptManager` and call `runServer()` to start an HTTP server that mimics the FileMaker OData endpoint pattern (`/fmi/odata/v4/test/Script.<name>`).

## Commands

- **Build:** `pnpm build` (runs `tsc`, outputs to `dist/`)
- **Format:** `pnpm format` (Biome formatter)
- **Lint + fix:** `pnpm check` (Biome linter with auto-fix)

No test suite exists in this project.

## Code Style

- Uses Biome (not ESLint/Prettier) for linting and formatting
- 4-space indentation, 100-char line width
- Array types use shorthand syntax (`string[]` not `Array<string>`)
- Block statements required (no braceless `if`)
- No `console.log` — use `console.error`, `console.info`, `console.warn`, `console.debug`
- No unused imports or inferrable type annotations
- Commits follow Conventional Commits (enforced by commitlint via lefthook)

## Architecture

The library is ~5 source files with a straightforward flow:

- **`ScriptManager`** (`manager.ts`): Central registry. Holds scripts (name -> handler + OpenAPI definition) and shared schemas. Creates a Taxum router with POST routes for each registered script.
- **`Script` / `scriptHandlerProxy`** (`script.ts`): Defines the script type (handler + OpenAPI definition + schema dependencies). The proxy extracts `scriptParameterValue` from the JSON body via Zod, calls the handler, and wraps the result in FileMaker's `scriptResult` response format.
- **`runServer`** (`server.ts`): Wires up the router from `ScriptManager`, optionally adds a Redoc docs page at `/`, and starts a Taxum HTTP server.
- **`buildOpenApiSpec` / `renderDocs`** (`docs.ts`): Builds an OpenAPI 3.1 spec from registered scripts and schemas. `renderDocs` writes the spec as YAML to disk.

The HTTP layer uses **Taxum** (`@taxum/core`), not Express/Koa.
