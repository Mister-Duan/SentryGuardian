# Backend（Lite 开发说明）

**ingest（dsn）** 与 **控制台 API（monitor）** 为两个 Nest 进程，共用 `@sentry-guardian/database`。

## 本地进程

| 应用 | 包名 | 默认端口 | 职责 |
|------|------|----------|------|
| dsn | `@sentry-guardian/backend-dsn` | 3001 | Envelope ingest、按项目限流 |
| monitor | `@sentry-guardian/backend-monitor` | 3002 | JWT API、Grouper、symbolicator、告警、维护 |

```bash
# 根目录（需 DATABASE_URL）
pnpm --filter @sentry-guardian/backend-dsn dev
pnpm --filter @sentry-guardian/backend-monitor dev
```

## monitor 模块（Post-MVP）

| 模块 | 说明 |
|------|------|
| `issues` / `events` | Issue 列表/详情、事件历史 |
| `projects` | 项目 CRUD、DSN 轮换 |
| `releases` | Release + Source Map artifact |
| `symbolicator` | 堆栈符号化 |
| `stats` | 趋势、Release 对比、性能事务 |
| `comments` | Issue 评论 |
| `alerts` / `alerter` | 告警规则与 Webhook 派发 |
| `setup` | 首次部署引导 |
| `maintenance` | 事件 TTL 清理、错误率扫描 |
| `grouper` | Event → Issue 聚合 |

## Docker 全栈

```bash
docker compose -f docker/compose.yml up -d
```

启动 postgres → migrate → dsn + monitor → frontend（5173）。

Grouper 默认每 3s 轮询 `events.aggregated_at IS NULL`（`GROUPER_POLL_MS`）。事件保留见 `EVENT_RETENTION_DAYS`。

文档：[docs/learn/self-hosting.md](../../docs/learn/self-hosting.md)、[docs/configuration.md](../../docs/configuration.md)。
