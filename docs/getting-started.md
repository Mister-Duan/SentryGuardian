# 入门指南

本指南帮助你在 **30 分钟内**在本地跑通 SentryGuardian 完整链路：数据库 → ingest → Issue 聚合 → 控制台查看。

## 你将得到什么

| 组件 | 地址（默认） | 作用 |
|------|--------------|------|
| PostgreSQL | `localhost:5432` | 存储 Event / Issue / 用户 |
| backend/dsn | http://localhost:3001 | 接收 SDK 上报 |
| backend/monitor | http://localhost:3002 | 登录、Issue API、Grouper、告警 |
| frontend/monitor | http://localhost:5173 | 监控控制台 |
| examples/vanilla | http://localhost:5174 | 可选：触发测试错误 |
| examples/vue-vite | 见示例 README | 可选：Vue 3 集成演示 |

## 前置条件

| 项 | 要求 |
|----|------|
| Node.js | ≥ 20 |
| pnpm | ≥ 10（见根目录 `packageManager`） |
| Docker | 用于 PostgreSQL 或 Compose 全栈 |
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

**仅 Postgres（开发常用）**

```bash
docker compose -f docker/compose.yml up -d postgres
```

**或 Docker 全栈（一键 postgres + migrate + dsn + monitor + frontend）**

```bash
docker compose -f docker/compose.yml up -d
```

跳过下方第四～五步的手动 migrate/seed/dev，直接访问 http://localhost:5173/setup 完成首次引导。

## 第四步：迁移与种子数据

（Docker 全栈且已跑 `migrate` 时可跳过 migrate）

```bash
pnpm --filter @sentry-guardian/database db:migrate
pnpm --filter @sentry-guardian/database db:seed
```

**务必保存 seed 输出**，例如：

```text
DSN: http://localhost:3001/api/sentry/envelope/clxxxxxxxx
Admin / 管理员: admin@localhost
```

- 控制台登录：`admin@localhost` / `adminadmin`（可用 `SEED_ADMIN_*` 覆盖）
- SDK 接入：使用上面的 **DSN** 字符串（本地为 **HTTP**；生产域名由 `buildDsn` / `parseDsn` 使用 HTTPS）

空库也可不 seed，启动 monitor 后访问 **/setup** 完成引导。

## 第五步：启动服务

（已用 Docker 全栈时可跳过）

**方式 A — 一条命令（推荐）**

```bash
pnpm dev
```

同时启动 dsn（3001）、monitor（3002）、前端（5173）。

若同时改 `packages/*` 与后端/控制台，用 **`pnpm dev:full`**（SDK `tsup --watch` + 三应用热重启）。

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
2. 首次部署：http://localhost:5173/setup；或 seed 账号登录
3. 在 **项目** 或 Issue 页复制 DSN

## 第七步：触发一条错误

**方式 A — Vanilla 示例**

```bash
pnpm dev:example
```

打开 http://localhost:5174 ，点击 **Throw test error**。

**方式 B — Vue 示例**

```bash
cd examples/vue-vite
cp .env.example .env   # 填入 DSN
pnpm dev
```

**方式 C — 在自有页面中**

```javascript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'http://localhost:3001/api/sentry/envelope/<projectId>',
  environment: 'development',
  release: 'demo@1.0.0',
});

throw new Error('Hello SentryGuardian');
```

## 第八步：在控制台确认 Issue

1. Grouper 默认约 **3 秒**轮询一次（`GROUPER_POLL_MS`）
2. 刷新 Issue 列表页（支持搜索、环境/Release 筛选、24h 趋势）
3. 点击 Issue 查看堆栈、事件历史、评论

若列表为空，见下方 [故障排查](#故障排查)。

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| seed 失败 | Postgres 未启动 | `docker compose ... up -d postgres` |
| `pnpm dev` 报 `DATABASE_URL` | 未加载根 `.env` | `cp .env.example .env` |
| dsn/monitor 启动后立刻崩溃 | Prisma 未连库 | 确认 Postgres 与 `DATABASE_URL` |
| 登录 401 | 密码与 seed 不一致 | 重跑 seed 或 `/setup` |
| SDK 上报 401 | projectId 错误 | 使用完整 DSN |
| SDK 上报 429 | 超过项目每分钟限流 | 降低测试频率或调高 DB `rate_limit_per_minute` |
| Issue 一直为空 | Grouper 未跑 | 确认 monitor 进程与日志 |
| CORS 错误 | 前端直连错误 API | 开发用 Vite 代理；生产配置 `VITE_API_URL` |
| 堆栈未符号化 | 未上传 Source Map | 见 [sdk-guide.md](./learn/sdk-guide.md#source-map-与-release) |

ingest 契约测试（需数据库）：

```bash
DATABASE_URL=postgresql://sentryguardian:sentryguardian@localhost:5432/sentryguardian \
  pnpm exec vitest run apps/backend/dsn/src/envelope/envelope.e2e.test.ts
```

## 下一步读什么

| 目标 | 文档 |
|------|------|
| 查环境变量与 SDK 选项 | [configuration.md](./configuration.md) |
| 理解 Event / Issue / DSN | [learn/concepts.md](./learn/concepts.md) |
| 深入 SDK、Vue、性能、Source Map | [learn/sdk-guide.md](./learn/sdk-guide.md) |
| 控制台与 API | [learn/console-guide.md](./learn/console-guide.md) |
| 生产自托管 / Docker 全栈 | [learn/self-hosting.md](./learn/self-hosting.md) |
| Post-MVP 能力清单 | [plans/post-mvp-roadmap.md](./plans/post-mvp-roadmap.md) |
| 贡献代码 | [development.md](./development.md) |

完整学习路径：[learn/README.md](./learn/README.md)。
