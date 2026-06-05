# 自托管部署（Lite）

MVP **Lite 档**：单机 PostgreSQL + 两个 Nest 进程 + 静态控制台，无 ClickHouse / Redis 依赖。

## 架构（生产最小集）

```text
                    ┌─────────────────┐
  用户浏览器 ────────▶│  CDN / Nginx    │  控制台静态文件 (dist/)
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │ monitor :443    │  JWT API + Grouper
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ PostgreSQL      │
                    └────────▲────────┘
                             │
  业务站点 SDK ──────────────┼──▶ dsn :443 (ingest)
```

- **ingest 与 API 可同机不同端口**，也可用反向代理按路径或子域名拆分
- Grouper 与 monitor **同进程**，无需单独部署 worker

## 推荐组件

| 组件 | 建议 |
|------|------|
| 数据库 | 托管 PostgreSQL 14+（启用自动备份） |
| ingest | 1 实例，水平扩展非 MVP 重点 |
| monitor | 1 实例；Grouper 随进程运行 |
| 控制台 | 静态资源 + `VITE_API_URL` |
| TLS | 反向代理（Caddy / Nginx / Traefik）终止 HTTPS |

## 环境变量（生产）

复制 [.env.example](../../.env.example) 并至少设置：

```bash
DATABASE_URL=postgresql://USER:PASS@db.internal:5432/sentryguardian?sslmode=require
JWT_SECRET=<随机 32+ 字节>
CORS_ORIGIN=https://monitor.example.com
SEED_INGEST_HOST=ingest.example.com
DSN_PORT=3001
MONITOR_PORT=3002
MAX_ENVELOPE_BYTES=1048576
GROUPER_POLL_MS=3000
```

**切勿**在生产保留默认 `JWT_SECRET` 与 `adminadmin` 密码。

## 部署步骤概要

### 1. 数据库

```bash
pnpm --filter @sentry-guardian/database db:migrate
pnpm --filter @sentry-guardian/database db:seed
```

生产 seed 后：

- 立即修改管理员密码（或创建新用户后禁用 seed 账号——需自行扩展）
- 记录输出的 DSN 供业务方配置

### 2. 构建应用

```bash
pnpm install
pnpm build
# 或 CI 中分包构建，见 .github/workflows/ci.yml
```

产物：

| 包 | 启动命令 |
|----|----------|
| `@sentry-guardian/backend-dsn` | `node apps/backend/dsn/dist/main.js` |
| `@sentry-guardian/backend-monitor` | `node apps/backend/monitor/dist/main.js` |
| `@sentry-guardian/frontend-monitor` | 静态托管 `apps/frontend/monitor/dist/` |

开发时用 `tsx`；生产用编译后的 `dist/main.js`（需先 `tsc` 构建 backend 包）。

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

构建控制台时：`VITE_API_URL=https://monitor.example.com`。

### 4. 业务方 DSN

```text
https://ingest.example.com/api/sentry/{projectId}
```

与 seed / 控制台展示一致。`projectId` 为不可猜测的 cuid，请勿在公开文档中暴露生产项目 DSN。

## 资源与容量（经验值）

| 档位 | 规格 | 适用 |
|------|------|------|
| Lite 最小 | 1C2G + 20GB 盘 | 个人站、日活万级以内 |
| 建议起步 | 2C4G | 小团队、保留 30 天 Event |

Event 明细在 PostgreSQL JSONB；数据增长后需分区或归档（见 [architecture.md](../architecture.md) 留存策略）。

## 健康检查

| 服务 | 路径 |
|------|------|
| dsn | `GET /health`、`GET /ready`（ready 查 DB） |
| monitor | `GET /api/health`（全局前缀下注意路径；根路径 `GET /health` 已 exclude） |

可用于 K8s `liveness` / `readiness`。

## 备份

- 定期备份 PostgreSQL（含 `events`、`issues`）
- `.env` 与 `JWT_SECRET` 纳入密钥管理

## 未包含（MVP 外）

| 能力 | 说明 |
|------|------|
| 高可用 ingest 集群 | 需负载均衡 + 共享 DB |
| ClickHouse 分析档 | 见 architecture Analytics profile |
| 邮件 / Webhook 告警 | P2 alerter |
| 自动 TLS compose 一体镜像 | 当前 compose 仅 Postgres |

## 故障恢复

| 场景 | 操作 |
|------|------|
| Grouper 落后 | 重启 monitor；未聚合 events 会自动补处理 |
| ingest 短暂不可用 | SDK Buffer 有限重试；可能丢事件 |
| 误删 Issue | MVP 无回收站；从 events 可重建（需脚本） |

## 相关文档

- [getting-started.md](../getting-started.md) — 本地演练
- [configuration.md](../configuration.md) — 完整配置表
- [apps/backend/README.md](../../apps/backend/README.md) — 进程说明
