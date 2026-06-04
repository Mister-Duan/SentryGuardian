# MVP 实施主清单

> **当前步骤**：MVP Phase 0～10 **已完成**
>
> 架构：[architecture.md](../architecture.md) · 决策：[decisions.md](./decisions.md)

## 维护规则（强制）

**每完成一个步骤 ID（如 P2-03）或合并完成一小批步骤后，必须在任务结束前更新本文件**，再向用户汇报。不得只改代码不更新进度。

| 更新项 | 操作 |
|--------|------|
| 顶部 `当前步骤` | 写明刚完成的 ID + 下一步 ID（或「Phase N 已完成，下一步 Px-01」） |
| 对应 checkbox | `- [ ]` → `- [x]` |
| 「进度概览」表 | 该 Phase 状态改为「进行中」或「**已完成**」 |
| 「变更日志」 | 新增一行：日期、步骤 ID、1～3 行交付摘要 |
| Phase 验证命令 | 若该 Phase 全部完成，确认文内验证命令已可执行 |

可选：用户要求 commit 时，步骤 ID 写入 commit body 便于对照（如 `P2-04: computeFingerprint`）。

**本文件是 MVP 进度的唯一真相来源**；不要只更新 `.cursor/plans/` 中的计划副本。

---

## 已实现能力摘要（Phase 0～10）

| 模块 | 能力 |
|------|------|
| SDK | `types` → `utils` → `core` → `browser`（P0 集成、Fetch Transport） |
| 数据库 | Prisma、`organizations` / `users` / `projects` / `issues` / `events` |
| backend/dsn | Nest ingest、`POST /api/:projectId/envelope`、DSN 鉴权、幂等、脱敏 |
| backend/monitor | JWT 登录、Issue CRUD、Grouper worker、Projects + DSN |
| frontend/monitor | React 控制台：登录、Issue 列表/详情 |
| 端到端 | `examples/vanilla`、`docker/compose.yml`、根 `pnpm dev` |
| CI | Postgres 服务、分包 build/test、Changesets 配置 |

本地验证：`pnpm build && pnpm test`（详见 [development.md](../development.md)）。

---

## 进度概览

| Phase | 名称　　　　　　 | 步骤　　　　　 | 状态　　　 |
| -------| ------------------| ----------------| ------------|
| 0     | 工程底座　　　　 | P0-01～P0-07　 | **已完成** |
| 1     | packages/types　 | P1-01～P1-08　 | **已完成** |
| 2     | packages/utils　 | P2-01～P2-05　 | **已完成** |
| 3     | packages/core　　| P3-01～P3-12　 | **已完成** |
| 4     | browser SDK　　　| P4-01～P4-14　 | **已完成** |
| 5     | 数据库　　　　　 | P5-01～P5-06　 | **已完成** |
| 6     | backend/dsn　　　| P6-01～P6-09　 | **已完成** |
| 7     | backend/monitor　| P7-01～P7-12　 | **已完成** |
| 8     | frontend/monitor | P8-01～P8-10　 | **已完成** |
| 9     | 端到端　　　　　 | P9-01～P9-06　 | **已完成** |
| 10    | CI 收尾　　　　　| P10-01～P10-04 | **已完成** |

---

## Phase 0 — 工程底座

- [x] **P0-01** 创建 `docs/plans/*` 三文件 + 索引链接
- [x] **P0-02** `pnpm-workspace.yaml` + 根 scripts
- [x] **P0-03** `tsconfig.base.json` + 根 `tsconfig.json`
- [x] **P0-04** ESLint 9 flat + Prettier
- [x] **P0-05** Vitest 根配置
- [x] **P0-06** `.github/workflows/ci.yml`
- [x] **P0-07** decisions + architecture §11 已决项同步

**Phase 0 验证**：`pnpm install && pnpm test && pnpm spellcheck && pnpm lint`

## Phase 1 — packages/types

- [x] **P1-01** 包脚手架
- [x] **P1-02** StackFrame、Breadcrumb
- [x] **P1-03** ErrorEvent
- [x] **P1-04** Envelope
- [x] **P1-05** Issue
- [x] **P1-06** API DTO
- [x] **P1-07** 导出 + build
- [x] **P1-08** Vitest 快照

**Phase 1 验证**：`pnpm --filter @sentry-guardian/types build && pnpm test`

## Phase 2 — packages/utils

- [x] **P2-01** 包脚手架
- [x] **P2-02** normalizeTimestamp、truncate
- [x] **P2-03** 安全序列化
- [x] **P2-04** computeFingerprint
- [x] **P2-05** scrubUrl / 脱敏

**Phase 2 验证**：`pnpm --filter @sentry-guardian/utils build && pnpm --filter @sentry-guardian/utils test`

## Phase 3 — packages/core

- [x] **P3-01** 包脚手架
- [x] **P3-02** Integration
- [x] **P3-03** Scope
- [x] **P3-04** Client 骨架
- [x] **P3-05** EventProcessor
- [x] **P3-06** Envelope 编码
- [x] **P3-07** Transport 抽象
- [x] **P3-08** buffer + 429 退避
- [x] **P3-09** dedupe 占位
- [x] **P3-10** sampleRate / ignoreErrors
- [x] **P3-11** flush / close
- [x] **P3-12** init 工厂

**Phase 3 验证**：`pnpm --filter @sentry-guardian/core build && pnpm --filter @sentry-guardian/core test`

## Phase 4 — browser SDK

- [x] **P4-01** browser-utils 脚手架
- [x] **P4-02** getFetch
- [x] **P4-03** BrowserClient
- [x] **P4-04** globalHandlers
- [x] **P4-05** inboundFilters
- [x] **P4-06** dedupe
- [x] **P4-07** httpContext
- [x] **P4-08** linkedErrors
- [x] **P4-09** breadcrumbs
- [x] **P4-10** browserApiErrors
- [x] **P4-11** stack-parsers
- [x] **P4-12** fetch transport
- [x] **P4-13** 公开 API
- [x] **P4-14** build + jsdom 测试

**Phase 4 验证**：`pnpm --filter @sentry-guardian/browser build && pnpm --filter @sentry-guardian/browser test`

## Phase 5 — 数据库

- [x] **P5-01** Prisma libs/database
- [x] **P5-02** org / users / projects schema
- [x] **P5-03** events schema
- [x] **P5-04** issues schema
- [x] **P5-05** migration + docker postgres
- [x] **P5-06** seed DSN

**Phase 5 验证**：`docker compose -f docker/compose.yml up -d postgres` → `pnpm --filter @sentry-guardian/database db:migrate` → `pnpm --filter @sentry-guardian/database db:seed`

## Phase 6 — backend/dsn

- [x] **P6-01** Nest 脚手架 + health
- [x] **P6-02** /health、/ready
- [x] **P6-03** EnvelopeModule
- [x] **P6-04** DsnAuthGuard
- [x] **P6-05** POST envelope
- [x] **P6-06** event_id 幂等
- [x] **P6-07** 大小限制 + scrubbing
- [x] **P6-08** CORS
- [x] **P6-09** 契约测试

**Phase 6 验证**：`pnpm --filter @sentry-guardian/backend-dsn build`（契约测试需 `DATABASE_URL`）

## Phase 7 — backend/monitor

- [x] **P7-01** Nest 脚手架
- [x] **P7-02** AuthModule JWT
- [x] **P7-03** POST /api/auth/login
- [x] **P7-04** ProjectsModule + DSN
- [x] **P7-05** GrouperWorker
- [x] **P7-06** fingerprint upsert
- [x] **P7-07** GET /api/issues
- [x] **P7-08** GET /api/issues/:id
- [x] **P7-09** PATCH issue status
- [x] **P7-10** grouper golden test
- [x] **P7-11** Lite all-in-one 文档
- [x] **P7-12** docker/.env.example

**Phase 7 验证**：`pnpm --filter @sentry-guardian/backend-monitor build && pnpm --filter @sentry-guardian/backend-monitor test`

## Phase 8 — frontend/monitor

- [x] **P8-01** Vite + React 脚手架
- [x] **P8-02** shadcn/ui
- [x] **P8-03** API client
- [x] **P8-04** 登录页
- [x] **P8-05** Issue 列表
- [x] **P8-06** Issue 详情
- [x] **P8-07** VITE_API_URL
- [x] **P8-08** 路由守卫
- [x] **P8-09** smoke 测试
- [x] **P8-10** 生产 build 说明

**Phase 8 验证**：`pnpm --filter @sentry-guardian/frontend-monitor build`

## Phase 9 — 端到端

- [x] **P9-01** examples/vanilla
- [x] **P9-02** docker/compose.yml
- [x] **P9-03** 根 pnpm dev
- [x] **P9-04** 手动 E2E 清单
- [x] **P9-05** CHANGELOG MVP
- [x] **P9-06** README 快速开始

**Phase 9 验证**：见下方「手动 E2E 清单」

## Phase 10 — CI 收尾

- [x] **P10-01** CI packages build + test
- [x] **P10-02** CI backend test
- [x] **P10-03** CI frontend build
- [x] **P10-04** Changesets

**Phase 10 验证**：推送后 GitHub Actions `quality` job 全绿

---

## 变更日志

| 日期 | 步骤 | 交付摘要 |
|------|------|----------|
| 2026-06-03 | P0-01 | 创建 docs/plans/ 三文件；docs/README.md 增加实施计划链接 |
| 2026-06-03 | P0-02～P0-07 | workspace、tsconfig、eslint、prettier、vitest、CI、architecture §11 已决 |
| 2026-06-03 | P1-01～P1-08 | `@sentry-guardian/types` 协议类型、tsup 构建、快照测试 |
| 2026-06-03 | （规范） | 中英文 JSDoc 规范 `doc-comments.md`；本文件增加 §维护规则 |
| 2026-06-03 | P2-01～P2-05 | `@sentry-guardian/utils` 指纹/序列化/脱敏、golden 测试 |
| 2026-06-03 | （规范） | JSDoc 函数须含 Input/Output `@example`；utils/types 示例补全 |
| 2026-06-03 | P3-01～P3-12 | `@sentry-guardian/core` Client/Scope/Transport/Envelope/init |
| 2026-06-03 | （文档） | 同步 README/overview/architecture；新增 packages.md、development.md |
| 2026-06-03 | P4-01～P4-14 | `browser-utils`、`@sentry-guardian/browser` P0 集成、FetchTransport、jsdom 测试 |
| 2026-06-03 | （规范） | 函数/字段调整须同步用途说明与 Input/Output 示例；AI 规则落地 |
| 2026-06-03 | P5-01～P5-06 | `@sentry-guardian/database` Prisma、迁移、docker postgres、seed |
| 2026-06-03 | P6-01～P10-04 | backend dsn/monitor、React 控制台、examples、CI+Changesets；MVP 闭环 |

---

## 手动 E2E 清单（P9-04）

1. `cp .env.example .env` 并启动 Postgres：`docker compose -f docker/compose.yml up -d postgres`
2. `pnpm --filter @sentry-guardian/database db:migrate && pnpm --filter @sentry-guardian/database db:seed`（记录 DSN）
3. 终端 A：`pnpm --filter @sentry-guardian/backend-dsn dev`（3001）
4. 终端 B：`pnpm --filter @sentry-guardian/backend-monitor dev`（3002）
5. 终端 C：`pnpm --filter @sentry-guardian/frontend-monitor dev`（5173）
6. 浏览器打开 `http://localhost:5173`，登录 `admin@localhost` / `adminadmin`
7. 终端 D：`cd examples/vanilla && VITE_DSN='<seed 输出的 DSN>' pnpm dev`，点击 **Throw test error**
8. 等待 Grouper（约 3s），刷新控制台 Issue 列表，打开详情查看堆栈 JSON
