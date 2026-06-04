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
| `pnpm dev` | 并行启动 dsn + monitor + 前端 |
| `pnpm changeset` | 创建 Changeset（发布用） |

## 服务与端口

| 包 | 命令 | 端口 |
|----|------|------|
| `@sentry-guardian/backend-dsn` | `pnpm --filter @sentry-guardian/backend-dsn dev` | 3001 |
| `@sentry-guardian/backend-monitor` | `pnpm --filter @sentry-guardian/backend-monitor dev` | 3002 |
| `@sentry-guardian/frontend-monitor` | `pnpm --filter @sentry-guardian/frontend-monitor dev` | 5173 |

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
