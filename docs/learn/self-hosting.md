# 自托管部署（Lite）

**Lite 档**：单机 PostgreSQL + dsn + monitor（含 Grouper、告警、维护任务）+ 静态控制台。无 Redis；ClickHouse 仅可选 profile 占位。

## 架构（生产最小集）

```text
                    ┌─────────────────┐
  用户浏览器 ────────▶│  CDN / Nginx    │  控制台静态文件 (dist/)
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │ monitor :443    │  JWT API + Grouper + Alerter
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ PostgreSQL      │
                    └────────▲────────┘
                             │
  业务站点 SDK ──────────────┼──▶ dsn :443 (ingest + 限流)
```

- **ingest 与 API 可同机不同端口**，也可用反向代理按路径或子域名拆分
- Grouper、告警扫描、事件清理与 monitor **同进程**，无需单独 worker

## 部署方式

### 方式 A：Docker Compose 全栈（开发 / 演示）

```bash
cp .env.example .env
docker compose -f docker/compose.yml up -d
```

启动顺序：`postgres` → `migrate` → `dsn` + `monitor` → `frontend`（preview 5173）。

| 服务 | 端口 |
|------|------|
| postgres | 5432 |
| dsn | 3001 |
| monitor | 3002 |
| frontend | 5173 |

首次访问 http://localhost:5173/setup 完成引导，或使用 `db:seed` 后登录。

可选 Analytics profile（仅占位，无应用代码）：

```bash
docker compose -f docker/compose.yml --profile analytics up -d clickhouse
```

### 方式 B：裸机 / 托管 VM（生产推荐）

见下文「部署步骤概要」。

## 推荐组件

| 组件 | 建议 |
|------|------|
| 数据库 | 托管 PostgreSQL 14+（启用自动备份） |
| ingest | 1 实例；按项目 `rate_limit_per_minute` 内存限流（默认 100/min） |
| monitor | 1 实例；Grouper + 维护 + 告警随进程运行 |
| 控制台 | 静态资源 + `VITE_API_URL` |
| TLS | 反向代理（Caddy / Nginx / Traefik）终止 HTTPS |

## 环境变量（生产）

复制 [.env.example](../../.env.example) 并至少设置：

```bash
DATABASE_URL=postgresql://USER:PASS@db.internal:5432/sentryguardian?sslmode=require
JWT_SECRET=<随机 32+ 字节>
CORS_ORIGIN=https://app.example.com
SEED_INGEST_HOST=ingest.example.com
DSN_PORT=3001
MONITOR_PORT=3002
MAX_ENVELOPE_BYTES=1048576
GROUPER_POLL_MS=3000
EVENT_RETENTION_DAYS=30

# 告警邮件（可选；未配置 SMTP 时仅 Webhook 生效）
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
```

**切勿**在生产保留默认 `JWT_SECRET` 与 `adminadmin` 密码。

完整变量表：[configuration.md](../configuration.md#环境变量)。

## 部署步骤概要

### 1. 数据库

```bash
pnpm --filter @sentry-guardian/database db:migrate
```

**首次初始化**二选一：

- **引导页**：启动 monitor 后访问 `/setup`（空库）
- **种子脚本**：`pnpm --filter @sentry-guardian/database db:seed`

生产 seed / 引导后：

- 立即修改管理员密码
- 记录 DSN 供业务方配置

### 2. 构建应用

```bash
pnpm install
pnpm build
```

产物：

| 包 | 启动命令 |
|----|----------|
| `@sentry-guardian/backend-dsn` | `node apps/backend/dsn/dist/main.js` |
| `@sentry-guardian/backend-monitor` | `node apps/backend/monitor/dist/main.js` |
| `@sentry-guardian/frontend-monitor` | 静态托管 `apps/frontend/monitor/dist/` |

### 3. 反向代理示例（Nginx 片段）

```nginx
# ingest
server {
  listen 443 ssl;
  server_name ingest.example.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    client_max_body_size 2m;
  }
}

# monitor API
server {
  listen 443 ssl;
  server_name monitor.example.com;
  location / {
    proxy_pass http://127.0.0.1:3002;
  }
}

# 控制台静态
server {
  listen 443 ssl;
  server_name app.example.com;
  root /var/www/sentryguardian-monitor;
  try_files $uri /index.html;
}
```

构建控制台：`VITE_API_URL=https://monitor.example.com`。

### 4. 业务方 DSN

```text
https://ingest.example.com/api/sentry/{projectId}
```

与控制台 / seed 输出一致。`projectId` 为 cuid，请勿在公开文档中暴露生产 DSN。

### 5. Source Map（可选）

构建后上传至对应 Release：

```bash
node scripts/upload-sourcemaps.mjs \
  --project-id <id> \
  --token <jwt> \
  --release 1.2.0 \
  --dir ./dist
```

环境变量 `MONITOR_API_URL` 可覆盖 API 根地址（默认 `http://localhost:3002`）。

## 资源与容量（经验值）

| 档位 | 规格 | 适用 |
|------|------|------|
| Lite 最小 | 1C2G + 20GB 盘 | 个人站、日活万级以内 |
| 建议起步 | 2C4G | 小团队、`EVENT_RETENTION_DAYS=30` |

Event 明细在 PostgreSQL JSONB；`maintenance` 按 `EVENT_RETENTION_DAYS` 每小时清理过期事件。数据增长后需分区或归档（见 [architecture.md](../architecture.md)）。

## 健康检查

| 服务 | 路径 |
|------|------|
| dsn | `GET /health`、`GET /ready`（ready 查 DB） |
| monitor | `GET /api/health` |

可用于 K8s `liveness` / `readiness`。

## 备份

- 定期备份 PostgreSQL（含 `events`、`issues`、`releases`、`artifacts`）
- `.env` 与 `JWT_SECRET` 纳入密钥管理

## 已包含（Post-MVP）

| 能力 | 说明 |
|------|------|
| Webhook 告警 | 新 Issue、错误率阈值；控制台 `/alerts` 配置 |
| 事件保留 | `EVENT_RETENTION_DAYS`，monitor 定时清理 |
| ingest 限流 | 按项目 `rate_limit_per_minute`，超限 `429` + `Retry-After` |
| Source Map | Release artifact + symbolicator |
| 性能事务 | SDK integration + 控制台 `/performance` |
| Docker 全栈 | `docker/compose.yml` postgres + migrate + dsn + monitor + frontend |

## 未包含 / 占位

| 能力 | 说明 |
|------|------|
| 高可用 ingest 集群 | 需负载均衡 + 共享 DB |
| ClickHouse 分析 | Compose `analytics` profile 仅占位 |
| 真实 SMTP 发信 | 配置 `SMTP_HOST` 后当前仅日志桩 |
| `packages/react` | 按用户决策不实现 |
| `allowed_origins` 校验 | 字段已入库，ingest 尚未启用 |
| 自动 TLS 一体镜像 | 需自行 Nginx / Caddy |

## 故障恢复

| 场景 | 操作 |
|------|------|
| Grouper 落后 | 重启 monitor；未聚合 events 会自动补处理 |
| ingest 短暂不可用 | SDK Buffer 有限重试；可能丢事件 |
| ingest 429 | 检查流量或调高项目 `rate_limit_per_minute` |
| 误删 Issue | 无回收站；可从 events 重建（需脚本） |

## 相关文档

- [getting-started.md](../getting-started.md) — 本地演练
- [configuration.md](../configuration.md) — 完整配置表
- [apps/backend/README.md](../../apps/backend/README.md) — 进程说明
