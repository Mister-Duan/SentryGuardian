# Backend（Lite 开发说明）

MVP 将 **ingest（dsn）** 与 **控制台 API（monitor）** 拆为两个 Nest 进程，共用 `@sentry-guardian/database`。

## 本地进程

| 应用 | 包名 | 默认端口 | 职责 |
|------|------|----------|------|
| dsn | `@sentry-guardian/backend-dsn` | 3001 | Envelope ingest |
| monitor | `@sentry-guardian/backend-monitor` | 3002 | 登录、Issue API、Grouper worker |

```bash
# 根目录（需 DATABASE_URL）
pnpm --filter @sentry-guardian/backend-dsn dev
pnpm --filter @sentry-guardian/backend-monitor dev
```

## Lite all-in-one（可选）

生产可仍分进程部署；本地也可用 Docker Compose 同时拉起 postgres + dsn + monitor + 前端（见 `docker/compose.yml`）。

Grouper 默认每 3s 轮询 `events.aggregated_at IS NULL`（`GROUPER_POLL_MS` 可配置）。
