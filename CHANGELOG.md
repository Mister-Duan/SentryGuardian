# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
