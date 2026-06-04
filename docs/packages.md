# Packages 实现状态

Monorepo 中 `packages/` 下各包的**实现进度**与文档入口。架构职责见 [architecture.md](./architecture.md) §4。

## 总览

| 包 | npm 名 | 状态 | README |
|----|--------|------|--------|
| types | `@sentry-guardian/types` | **已实现** | [packages/types/README.md](../packages/types/README.md) |
| utils | `@sentry-guardian/utils` | **已实现** | [packages/utils/README.md](../packages/utils/README.md) |
| core | `@sentry-guardian/core` | **已实现** | [packages/core/README.md](../packages/core/README.md) |
| browser-utils | `@sentry-guardian/browser-utils` | **已实现**（internal） | — |
| browser | `@sentry-guardian/browser` | **已实现** | [packages/browser/README.md](../packages/browser/README.md) |
| vue | `@sentry-guardian/vue` | 未开始 | architecture §4.6 |
| database | `@sentry-guardian/database` | **已实现** | [apps/backend/libs/database/README.md](../apps/backend/libs/database/README.md) |
| backend-dsn | `@sentry-guardian/backend-dsn` | **已实现** | [apps/backend/README.md](../apps/backend/README.md) |
| backend-monitor | `@sentry-guardian/backend-monitor` | **已实现** | [apps/backend/README.md](../apps/backend/README.md) |
| frontend-monitor | `@sentry-guardian/frontend-monitor` | **已实现** | [apps/frontend/monitor/README.md](../apps/frontend/monitor/README.md) |

## `@sentry-guardian/types`

**职责**：跨端协议类型（`ErrorEvent`、`Envelope`、`Issue`、API DTO），无运行时。

**主要导出**：`ErrorEvent`、`Envelope`、`Issue`、`LoginRequest`、`IssueListResponse` 等。

**依赖**：无 workspace 依赖。

## `@sentry-guardian/utils`

**职责**：指纹、安全序列化、脱敏、时间处理。

**主要导出**：`computeFingerprint`、`safeSerialize`、`scrubUrl`、`normalizeTimestamp`。

**依赖**：`@sentry-guardian/types`。

> `computeFingerprint` 使用 Node `crypto`，供 backend grouper；浏览器侧按需 tree-shake。

## `@sentry-guardian/core`

**职责**：SDK 内核——`Client`、`Scope`、`Integration`、`beforeSend`、Envelope 编解码、`BufferTransport`、`init`。

**主要导出**：`init`、`Client`、`captureException`、`createEnvelope`、`serializeEnvelope`、`BufferTransport`。

**依赖**：`types`、`utils`。

**不包含**：`window` 监听、真实 `fetch` 上报（由 `browser` 包提供）。

## `@sentry-guardian/browser-utils`（internal）

**职责**：浏览器环境工具（`getFetch`）。

**依赖**：无 workspace 依赖。

## `@sentry-guardian/browser`

**职责**：浏览器 SDK 主入口——`init`、`BrowserClient`、P0 integrations、`FetchTransport`、堆栈解析。

**主要导出**：`init`、`captureException`、`getDefaultIntegrations`、`FetchTransport`、`parseStack`。

**依赖**：`core`、`browser-utils`、`types`。

## `@sentry-guardian/database`

**职责**：PostgreSQL 元数据与 Event 存储（Prisma）。

**主要模型**：`Organization`、`User`、`Project`、`Issue`、`Event`。

**依赖**：Prisma + PostgreSQL。

## 后续包（规划）

| 包 | 依赖 | MVP 步骤 |
|----|------|----------|
| vue | browser, core | MVP 外暂缓 |

## 构建顺序

从空仓库克隆后，按依赖顺序构建：

```bash
pnpm --filter @sentry-guardian/types build
pnpm --filter @sentry-guardian/utils build
pnpm --filter @sentry-guardian/core build
pnpm --filter @sentry-guardian/browser-utils build
pnpm --filter @sentry-guardian/browser build
# 或根目录：pnpm build
```
