# 入门指南

本指南帮助你在 **30 分钟内**在本地跑通 SentryGuardian 完整链路：数据库 → ingest → Issue 聚合 → 控制台查看。

## 你将得到什么

| 组件 | 地址（默认） | 作用 |
|------|--------------|------|
| PostgreSQL | `localhost:5432` | 存储 Event / Issue / 用户 |
| backend/dsn | http://localhost:3001 | 接收 SDK 上报 |
| backend/monitor | http://localhost:3002 | 登录、Issue API、Grouper |
| frontend/monitor | http://localhost:5173 | 监控控制台 |
| examples/vanilla | http://localhost:5174 | 可选：触发测试错误 |

## 前置条件

| 项 | 要求 |
|----|------|
| Node.js | ≥ 20 |
| pnpm | ≥ 10（见根目录 `packageManager`） |
| Docker | 用于启动 PostgreSQL（或自备兼容实例） |
| 操作系统 | macOS / Linux / WSL2 |

## 第一步：克隆与构建

```bash
git clone <repo-url> SentryGuardian
cd SentryGuardian
pnpm install
pnpm build
```

验证：

```bash
pnpm test && pnpm lint
```

## 第二步：配置环境变量

```bash
cp .env.example .env
```

开发环境通常无需改 `.env`。根目录 `pnpm dev` 与两个后端包的 `dev` 脚本会通过 `--env-file` 读取该文件（**必填** `DATABASE_URL`）。生产部署见 [configuration.md](./configuration.md)。

## 第三步：启动数据库

```bash
docker compose -f docker/compose.yml up -d postgres
```

确认健康：

```bash
docker compose -f docker/compose.yml ps
```

## 第四步：迁移与种子数据

```bash
pnpm --filter @sentry-guardian/database db:migrate
pnpm --filter @sentry-guardian/database db:seed
```

**务必保存 seed 输出**，例如：

```text
DSN: http://a1b2c3...@localhost:3001/api/clxxxxxxxx
Admin / 管理员: admin@localhost
```

- 控制台登录：`admin@localhost` / `adminadmin`（可用 `SEED_ADMIN_*` 覆盖）
- SDK 接入：使用上面的 **DSN** 字符串（本地为 **HTTP**；生产域名由 `buildDsn` / `parseDsn` 使用 HTTPS）

## 第五步：启动服务

**方式 A — 一条命令（推荐）**

```bash
pnpm dev
```

同时启动 dsn（3001）、monitor（3002）、前端（5173）。首次会先构建 workspace 依赖并编译后端 `dist/`（见 [development.md §后端 dev](./development.md#后端-dev-说明)）。

**方式 B — 分终端**

```bash
pnpm --filter @sentry-guardian/backend-dsn dev
pnpm --filter @sentry-guardian/backend-monitor dev
pnpm --filter @sentry-guardian/frontend-monitor dev
```

健康检查：

```bash
curl http://localhost:3001/health
curl http://localhost:3002/api/health
```

## 第六步：打开控制台

1. 浏览器访问 http://localhost:5173
2. 使用 seed 输出的管理员账号登录
3. 在项目下拉框中可看到 **Default Project** 与对应 DSN

## 第七步：触发一条错误

**方式 A — Vanilla 示例**

```bash
cd examples/vanilla
cp .env.example .env   # 填入 seed 输出的 DSN
pnpm dev
```

打开 http://localhost:5174 ，点击 **Throw test error**。详见 [examples/vanilla/README.md](../examples/vanilla/README.md)。

**方式 B — 在自有页面中**

```javascript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'http://<publicKey>@localhost:3001/api/<projectId>',
  environment: 'development',
});

throw new Error('Hello SentryGuardian');
```

## 第八步：在控制台确认 Issue

1. Grouper 默认约 **3 秒**轮询一次（`GROUPER_POLL_MS`）
2. 刷新 Issue 列表页
3. 点击某条 Issue 查看详情与最近事件 JSON

若列表为空，见下方 [故障排查](#故障排查)。

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| seed 失败 | Postgres 未启动 | `docker compose ... up -d postgres` |
| `pnpm dev` 报 `DATABASE_URL` | 未加载根 `.env` | `cp .env.example .env`；勿只 export 单个变量（后端 dev 已读 `.env`） |
| dsn/monitor 启动后立刻崩溃 | 用 `tsx` 跑 Nest 或 Prisma 未连库 | 使用包内 `dev` 脚本；确认 Postgres 与 `DATABASE_URL` |
| `Cannot read properties of undefined (reading 'event')` | 旧 `tsx` dev 导致 DI 失败 | 拉最新代码，用 `pnpm dev`（`tsc` + `node --watch`） |
| `net::ERR_SSL_PROTOCOL_ERROR` | 浏览器用 HTTPS 访问本地 HTTP ingest | DSN 用 `http://localhost:...`；或升级 SDK 后 `core`/`browser` 重建并重启示例 |
| 登录 401 | 密码与 seed 不一致 | 重跑 seed 或核对 `SEED_ADMIN_PASSWORD` |
| SDK 上报 401 | DSN / publicKey 错误 | 使用 seed 完整 DSN；或控制台项目页复制 |
| Issue 一直为空 | Grouper 未跑或 monitor 未连库 | 确认 monitor 进程、查看其日志 |
| CORS 错误 | 前端直连错误 API 地址 | 开发用 Vite 代理；生产配置 `VITE_API_URL` |
| 重复事件不增加 | `event_id` 幂等 | 正常；换 `captureException` 或新错误文本 |

ingest 契约测试（需数据库）：

```bash
DATABASE_URL=postgresql://sentryguardian:sentryguardian@localhost:5432/sentryguardian \
  pnpm --filter @sentry-guardian/backend-dsn test
```

## 下一步读什么

| 目标 | 文档 |
|------|------|
| 查环境变量与 SDK 选项 | [configuration.md](./configuration.md) |
| 理解 Event / Issue / DSN | [learn/concepts.md](./learn/concepts.md) |
| 深入 SDK 与集成 | [learn/sdk-guide.md](./learn/sdk-guide.md) |
| 控制台与 API | [learn/console-guide.md](./learn/console-guide.md) |
| 生产自托管 | [learn/self-hosting.md](./learn/self-hosting.md) |
| 贡献代码 | [development.md](./development.md) |

完整学习路径：[learn/README.md](./learn/README.md)。
