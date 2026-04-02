# [3.0.0](https://github.com/soliantconsulting/fm-mock-server/compare/v2.1.0...v3.0.0) (2026-04-02)


### Features

* rewrite with Zod-first createScript API and Scalar docs ([bc086c5](https://github.com/soliantconsulting/fm-mock-server/commit/bc086c54dfeb1046dbd9d5f26fd1d88186a627a9))


### BREAKING CHANGES

* The entire public API has changed. `ScriptManager` is
removed; pass `Script[]` directly to `runServer()`, `buildOpenApiSpec()`,
and `renderDocsHtml()`. Scripts are now defined via `createScript()`
with Zod schemas instead of manual OpenAPI schema objects. The
`renderDocs()` function (YAML file output) is replaced by
`renderDocsHtml()` (Scalar HTML). Exports `ScriptDefinition`,
`ScriptHandler`, and `ScriptHandlerResult` are removed; use `Script`
and the new `ErrorObject`, `SingleFailureResponse`, and
`MultiFailureResponse` types instead.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>

# [2.1.0](https://github.com/soliantconsulting/fm-mock-server/compare/v2.0.0...v2.1.0) (2026-03-24)


### Features

* add OpenAPI preview via Redoc to the dev server ([c2ec887](https://github.com/soliantconsulting/fm-mock-server/commit/c2ec8872a7a0902deb7bb8109fefdf9519ff10ea))

# [2.0.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.10.1...v2.0.0) (2026-03-24)


### Features

* replace koa with taxum ([8ddc461](https://github.com/soliantconsulting/fm-mock-server/commit/8ddc46193ec27b9ceb8396d0ad4015c33ef9b484))


### BREAKING CHANGES

* you now need to wait `runServer()`

## [1.10.1](https://github.com/soliantconsulting/fm-mock-server/compare/v1.10.0...v1.10.1) (2025-10-23)


### Bug Fixes

* add provenance attestation ([aeffe78](https://github.com/soliantconsulting/fm-mock-server/commit/aeffe784cb68f94fd160633f6c95348f5cca86dd))

# [1.10.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.9.0...v1.10.0) (2024-09-05)


### Features

* allow responseSchema to be omitted ([fc40a25](https://github.com/soliantconsulting/fm-mock-server/commit/fc40a25035f9de31cf5aab8f398e9c41f3e6221e))

# [1.9.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.8.0...v1.9.0) (2024-09-05)


### Features

* allow data property to be omitted ([0c488dc](https://github.com/soliantconsulting/fm-mock-server/commit/0c488dc4d33e788dfe8fe08853d64c91bc45b1fc))

# [1.8.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.7.0...v1.8.0) (2024-08-29)


### Features

* shorten fake protocol name in docs ([4a6c5e6](https://github.com/soliantconsulting/fm-mock-server/commit/4a6c5e615c6bb989295b7ba496a0a0878eee6fc0))

# [1.7.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.6.0...v1.7.0) (2024-08-14)


### Features

* force better display of script name in server drop down ([c42bd19](https://github.com/soliantconsulting/fm-mock-server/commit/c42bd194e55bcc4e7ca2d0cd1f40d2875b12b2f5))

# [1.6.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.5.0...v1.6.0) (2024-08-02)


### Features

* allow defining summary for operations ([ed1610d](https://github.com/soliantconsulting/fm-mock-server/commit/ed1610de29217344f5898e074ca76dfbe278830b))

# [1.5.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.4.0...v1.5.0) (2024-07-30)


### Features

* allow to pass reference objects for script schemas ([160364d](https://github.com/soliantconsulting/fm-mock-server/commit/160364d1146af31b22ac5ad3642906f8b4261e77))

# [1.4.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.3.0...v1.4.0) (2024-04-29)


### Features

* allow injecting global schemas into manager ([b333b5f](https://github.com/soliantconsulting/fm-mock-server/commit/b333b5f9bddcfe7e9a6242ee108209193bdf0fca))

# [1.3.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.2.0...v1.3.0) (2024-04-26)


### Features

* add optional tags definition for scripts ([6426d08](https://github.com/soliantconsulting/fm-mock-server/commit/6426d08d3c6d4a32bfb7d64be08f0610e3188d41))

# [1.2.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.1.0...v1.2.0) (2024-04-26)


### Features

* allow defining meta schemas ([32865a0](https://github.com/soliantconsulting/fm-mock-server/commit/32865a07449e227a8f18c4d1829c4d7c07e3e601))

# [1.1.0](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.8...v1.1.0) (2024-04-01)


### Features

* add expose flag to errors ([d818609](https://github.com/soliantconsulting/fm-mock-server/commit/d818609300a572fa730a14a150e4897311ef10f4))

## [1.0.8](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.7...v1.0.8) (2024-03-27)


### Bug Fixes

* default script parameter to unknown ([180e2db](https://github.com/soliantconsulting/fm-mock-server/commit/180e2db387541eedaf946c9db713971508f1a2a4))

## [1.0.7](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.6...v1.0.7) (2024-03-27)


### Bug Fixes

* let scripts specify the parameter type ([ebcb85d](https://github.com/soliantconsulting/fm-mock-server/commit/ebcb85d09c5b68d526f47dbbf8588d0528939fc7))

## [1.0.6](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.5...v1.0.6) (2024-03-27)


### Bug Fixes

* pass script parameter value into scripts ([cb94b2b](https://github.com/soliantconsulting/fm-mock-server/commit/cb94b2bc8dd90e5782a0fd3d74b8180fcdba8865))

## [1.0.5](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.4...v1.0.5) (2024-03-07)


### Bug Fixes

* **server:** stringify address before outputing ([185a9b4](https://github.com/soliantconsulting/fm-mock-server/commit/185a9b43488add7434405f9383bc8e958c521530))

## [1.0.4](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.3...v1.0.4) (2024-03-07)


### Bug Fixes

* **script:** parse from context.request.body instead of context.body ([b972c33](https://github.com/soliantconsulting/fm-mock-server/commit/b972c33d69c7400b5f2e2996e061cbd78e846c3a))

## [1.0.3](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.2...v1.0.3) (2024-03-07)


### Bug Fixes

* **script:** accept any scriptParameterValue ([f87d392](https://github.com/soliantconsulting/fm-mock-server/commit/f87d39230f568dc6e668b1b449081cbe023c8f87))

## [1.0.2](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.1...v1.0.2) (2024-03-07)


### Bug Fixes

* **script:** wrap result in scriptResult property ([c106ca8](https://github.com/soliantconsulting/fm-mock-server/commit/c106ca8139f4e300ba5107bd0d1722dde3d08897))

## [1.0.1](https://github.com/soliantconsulting/fm-mock-server/compare/v1.0.0...v1.0.1) (2024-03-04)


### Bug Fixes

* **release:** include declarations and add exports section ([1b53485](https://github.com/soliantconsulting/fm-mock-server/commit/1b5348540f5398cb47e88a77a8a4099efa61755b))

# 1.0.0 (2024-03-04)


### Features

* initial commit ([8825646](https://github.com/soliantconsulting/fm-mock-server/commit/8825646b5f70b35612ebf74dae9e66c611340fd3))
