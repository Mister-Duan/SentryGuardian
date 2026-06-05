# 本地开发指南

面向**贡献者**与 AI 协作的命令索引。首次使用请先读 [getting-started.md](./getting-started.md)。

## 环境要求

| 项 | 版本 |
|----|------|
| Node.js | ≥ 20 |
| pnpm | ≥ 10（见根目录 `packageManager`） |
| Docker | 本地 PostgreSQL（或自备实例） |

## 首次克隆

```bash
git clone <repo-url> SentryGuardian
cd SentryGuardian
pnpm install
cp .env.example .env
```

## 根目录脚本

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建所有 workspace 包 |
| `pnpm test` | Vitest（node / browser / frontend 分项目） |
| `pnpm lint` | ESLint |
| `pnpm spellcheck` | 拼写检查 |
| `pnpm dev` | 并行启动 dsn + monitor + 前端（热重启，见下文） |
| `pnpm dev:packages` | 仅监听构建 SDK 包（types → browser，`tsup --watch`） |
| `pnpm dev:full` | **SDK 监听 + 三应用**（改 packages 与 apps 均自动重建/重启） |
| `pnpm dev:example` | 启动 `examples/vanilla`（:5174，Vite HMR） |
| `pnpm changeset` | 创建 Changeset（发布用） |

## 服务与端口

| 包 | 命令 | 端口 |
|----|------|------|
| `@sentry-guardian/backend-dsn` | `pnpm --filter @sentry-guardian/backend-dsn dev` | 3001 |
| `@sentry-guardian/backend-monitor` | `pnpm --filter @sentry-guardian/backend-monitor dev` | 3002 |
| `@sentry-guardian/frontend-monitor` | `pnpm --filter @sentry-guardian/frontend-monitor dev` | 5173 |
| `@sentry-guardian/example-vanilla` | `cd examples/vanilla && pnpm dev` | 5174 |

### 热重启一览

| 场景 | 命令 | 行为 |
|------|------|------|
| 只改控制台 / Monitor API | `pnpm dev` | 前端 Vite HMR；后端 `tsc -w` + `node --watch` |
| 只改 SDK（types/core/browser 等） | `pnpm dev:packages` | 各包 `tsup --watch` 写入 `dist/` |
| 同时改 SDK + 后端/前端 | `pnpm dev:full` | 上两者并行；后端额外监听 `packages/*/dist` |
| 测 vanilla 示例 | 另开终端 `pnpm dev:example` | 依赖已构建的 `@sentry-guardian/browser`；SDK 开发时用 `dev:full` |

VS Code / Cursor：**Terminal → Run Task** 可选 `Dev: apps`、`Dev: full stack` 等（`.vscode/tasks.json`）。

### 后端 `dev` 说明

- 脚本：`scripts/dev-nest-backend.sh`（`tsc -w` 编译到 `dist/`，`node --watch --watch-path=dist` 及 workspace 包 `dist` 变更时重启）。
- **不要**用 `tsx watch src/main.ts` 跑 Nest：`emitDecoratorMetadata` 无效会导致 `PrismaService` 等注入为 `undefined`。
- 通过 `node --env-file=<repo>/.env` 加载**仓库根目录** `.env`（含 `DATABASE_URL`）；执行 `pnpm dev` 前请 `cp .env.example .env`。
- `predev` / `prebuild` 会自动 `pnpm --filter <app>^... run build`，构建 workspace 依赖，避免 `Cannot find module '@sentry-guardian/core'`。
- `tsconfig` 已排除 `*.test.ts` / `*.e2e.test.ts`；契约测试用根目录 `pnpm test` + Vitest。

### 修改 SDK 后（无 `dev:full` 时）

若未开 `pnpm dev:packages` / `pnpm dev:full`，改完 SDK 需手动构建：

```bash
pnpm --filter @sentry-guardian/browser... run build
```

## 数据库

```bash
docker compose -f docker/compose.yml up -d postgres
pnpm --filter @sentry-guardian/database db:migrate
pnpm --filter @sentry-guardian/database db:seed
```

## 按包构建与测试

| 包 | 构建 | 测试 |
|----|------|------|
| `@sentry-guardian/types` | `pnpm --filter @sentry-guardian/types build` | 根 `pnpm test` |
| `@sentry-guardian/utils` | `pnpm --filter @sentry-guardian/utils build` | 同上 |
| `@sentry-guardian/core` | `pnpm --filter @sentry-guardian/core build` | 同上 |
| `@sentry-guardian/browser` | `pnpm --filter @sentry-guardian/browser build` | 同上 |
| `@sentry-guardian/database` | `pnpm --filter @sentry-guardian/database build` | 同上 |
| `@sentry-guardian/backend-dsn` | `pnpm --filter @sentry-guardian/backend-dsn build` | `DATABASE_URL=... pnpm --filter @sentry-guardian/backend-dsn test` |
| `@sentry-guardian/backend-monitor` | `pnpm --filter @sentry-guardian/backend-monitor build` | `pnpm --filter @sentry-guardian/backend-monitor test` |

## 包依赖关系

```text
types
  ▲
  ├── utils ──▶ core ──▶ browser-utils ──▶ browser
  ├── database ──▶ nest-prisma ──▶ backend-dsn / backend-monitor
  └── types ──▶ frontend-monitor
```

详见 [architecture.md §3.1](./architecture.md#31-包依赖关系sdk-侧) 与 [packages.md](./packages.md)。

## 相关文档

- [getting-started.md](./getting-started.md) — 入门与 E2E
- [configuration.md](./configuration.md) — 环境变量与 SDK
- [learn/README.md](./learn/README.md) — 学习路径
- [ai-guide/delivery-checklist.md](./ai-guide/delivery-checklist.md) — 代码交付闭环
- [plans/mvp-implementation.md](./plans/mvp-implementation.md) — MVP 进度
