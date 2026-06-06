# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Database migration: backfill `issues.exception_type` and `issues.mechanism` from latest event payloads
- Monitor: issue list filters for exception type, capture mechanism, and severity level
- Examples: `examples/shared/error-demos.js` 覆盖全部默认错误类型；vanilla 按钮面板 + `csp-lab.html`；vue-vite 复用演示并增加 Vue 组件错误
- fix(sdk): CSP violations listen on window + document; use effectiveDirective; examples csp-lab DSN fallback and img-src demo
- Browser SDK: CSP violations, HTTP fetch/XHR failures, `console.error` capture, browser context; expanded resource tags (`iframe`, `video`, `audio`, `source`); global handler skips duplicate resource errors and records script line/column
- Monitor: stacked error-type trend chart (time × type/mechanism counts); `GET /error-type-trends`
- Monitor: error breakdown APIs (`/error-breakdown`), issue detail charts (type / mechanism / volume), enriched `EventDetail` (level, tags, mechanism, browser context)
- Post-MVP Phase 12～21: issue event history API, search/pagination, Source Map symbolicator, `@sentry-guardian/vue`, performance transactions, release compare, project CRUD, setup wizard, alerts (webhook), trends, comments, ingest rate limit, event retention, Docker full stack
- `@sentry-guardian/vue`: Vue 3 `vueIntegration` + `vueRouterIntegration`; `examples/vue-vite`
- `scripts/upload-sourcemaps.mjs` for CI source map upload
- Console pages: Projects, Releases, Performance, Alerts; setup flow at `/setup`
- Docs: updated `console-guide`, `self-hosting`, `configuration`, `sdk-guide`, `getting-started` for Post-MVP features
- Console UX: readable stack traces and breadcrumbs on issue detail; status filter; DSN copy; auto-refresh

### Changed

- Monitor: error trend chart X-axis ticks and labels span full plot width with readable time labels
- Monitor: error trend chart uses dynamic time buckets (finer for shorter ranges) with fixed thin columns; reduced overview height
- Monitor: issue stream default window is 12h with preset/custom time range picker; charts sit between filters and table and honor active filter pills
- Monitor: project scope shown as a Kibana-style filter pill; mechanism filter options use live error breakdown keys
- Monitor: issue list filters use Kibana-style pills, add-filter popover, and click-to-filter on table cells
- Monitor: issue page error overview uses tabs to switch between trend and breakdown charts
- Monitor: issue list columns for exception type, capture mechanism, and severity level
- Monitor: event breadcrumbs shown newest-first by timestamp on issue detail
- DSN ingest: project validation in `EnvelopeService.ingest` (removed unused `DsnAuthGuard`); explicit `@Inject` on DSN Nest providers for Vitest compatibility
- **BREAKING CHANGE:** DSN format is now `{scheme}://{host}/api/sentry/{projectId}` (no `publicKey@` in URL). Ingest route is `POST /api/sentry/{projectId}/envelope/`. `buildDsn(projectId, host)` signature changed.

### Added

- Local dev hot reload: `pnpm dev:packages` / `pnpm dev:full` / `pnpm dev:example`; shared `scripts/dev-nest-backend.sh`; VS Code tasks (`.vscode/tasks.json`)
- User docs: `docs/getting-started.md`, `docs/configuration.md`, `docs/learn/*` (concepts, data-flow, SDK, console, self-hosting)
- **MVP full stack**: `@sentry-guardian/backend-dsn` ingest, `@sentry-guardian/backend-monitor` API + Grouper, `@sentry-guardian/frontend-monitor` React console
- `@sentry-guardian/nest-prisma` shared Prisma module for Nest apps
- `examples/vanilla` SDK demo; root `pnpm dev` for dsn + monitor + frontend
- CI: PostgreSQL service, per-package build/test, frontend production build
- Changesets config (`.changeset/config.json`)
- `@sentry-guardian/utils/string` subpath export (browser-safe, no Node `crypto` in SDK bundle)
- `@sentry-guardian/database`: Prisma models, initial migration, seed script, `buildDsn`
- `docker/compose.yml` PostgreSQL for local dev; root `.env.example`
- Doc-comments rule: purpose + field docs + sync on API changes (`docs/ai-guide/doc-comments.md`, AI rules)
- `@sentry-guardian/browser-utils` (internal): `getFetch`
- `@sentry-guardian/browser`: `BrowserClient`, P0 integrations, `FetchTransport`, `parseStack`, `init` API
- `Client.addBeforeSend` for integration hooks
- Vitest `browser` project with jsdom for browser package tests
- Project initialization with AI collaboration guidelines
- Open-source development standards and delivery checklist
- cspell configuration and `pnpm spellcheck` script for documentation spell checking
- `@sentry-guardian/types` package: `ErrorEvent`, `Envelope`, `Issue`, API DTOs, stack/breadcrumb types
- `@sentry-guardian/utils` package: fingerprint, safeSerialize, scrub, timestamp helpers
- `@sentry-guardian/core` package: Client, Scope, Integration, Envelope codec, BufferTransport, init SDK
- Bilingual (EN + zh-CN) JSDoc/TSDoc convention in `docs/ai-guide/doc-comments.md` and AI collaboration rules
- JSDoc `@example` with Input/Output samples required for exported functions
- `docs/packages.md` and `docs/development.md` for package status and local dev commands

### Fixed

- `backend-dsn` / `backend-monitor`: exclude `*.test.ts` / `*.e2e.test.ts` from `tsc` build; `predev` / `prebuild` build workspace dependencies (fixes `Cannot find module '@sentry-guardian/core'`)
- `parseDsn` uses HTTP for loopback hosts even when DSN says `https://` (fixes local `ERR_SSL_PROTOCOL_ERROR`)
- `buildDsn` uses `http://` for localhost / loopback hosts

### Changed

- Docs: DSN 本地 HTTP/生产 HTTPS、`pnpm dev` 与 vanilla 示例故障排查（`getting-started`、`configuration`、`development`、`examples/vanilla`）
- `backend-dsn` / `backend-monitor` `dev` scripts: compile with `tsc` + `node --watch` (fixes Nest DI under `tsx`; loads root `.env` via `--env-file`)
- `GrouperService` starts polling on `onApplicationBootstrap` (after Prisma connects)
- Consolidate cspell configuration under `.cspell/` directory
- Align README, overview, and architecture with MVP Phase 0–10 completion
- Browser `FetchTransport` sends `X-Sentry-Guardian-Public-Key` for ingest auth
- `core` imports `normalizeTimestamp` from `@sentry-guardian/utils/string`
