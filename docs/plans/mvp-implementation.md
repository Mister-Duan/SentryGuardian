# MVP 实施主清单

> **当前步骤**：Phase 2 已完成，下一步 **P3-01**（待你确认后开始）
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

## 进度概览

| Phase | 名称　　　　　　 | 步骤　　　　　 | 状态　　　 |
| -------| ------------------| ----------------| ------------|
| 0     | 工程底座　　　　 | P0-01～P0-07　 | **已完成** |
| 1     | packages/types　 | P1-01～P1-08　 | **已完成** |
| 2     | packages/utils　 | P2-01～P2-05　 | **已完成** |
| 3     | packages/core　　| P3-01～P3-12　 | 待开始　　 |
| 4     | browser SDK　　　| P4-01～P4-14　 | 待开始　　 |
| 5     | 数据库　　　　　 | P5-01～P5-06　 | 待开始　　 |
| 6     | backend/dsn　　　| P6-01～P6-09　 | 待开始　　 |
| 7     | backend/monitor　| P7-01～P7-12　 | 待开始　　 |
| 8     | frontend/monitor | P8-01～P8-10　 | 待开始　　 |
| 9     | 端到端　　　　　 | P9-01～P9-06　 | 待开始　　 |
| 10    | CI 收尾　　　　　| P10-01～P10-04 | 待开始　　 |

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

- [ ] **P3-01** 包脚手架
- [ ] **P3-02** Integration
- [ ] **P3-03** Scope
- [ ] **P3-04** Client 骨架
- [ ] **P3-05** EventProcessor
- [ ] **P3-06** Envelope 编码
- [ ] **P3-07** Transport 抽象
- [ ] **P3-08** buffer + 429 退避
- [ ] **P3-09** dedupe 占位
- [ ] **P3-10** sampleRate / ignoreErrors
- [ ] **P3-11** flush / close
- [ ] **P3-12** init 工厂

## Phase 4 — browser SDK

- [ ] **P4-01** browser-utils 脚手架
- [ ] **P4-02** getFetch
- [ ] **P4-03** BrowserClient
- [ ] **P4-04** globalHandlers
- [ ] **P4-05** inboundFilters
- [ ] **P4-06** dedupe
- [ ] **P4-07** httpContext
- [ ] **P4-08** linkedErrors
- [ ] **P4-09** breadcrumbs
- [ ] **P4-10** browserApiErrors
- [ ] **P4-11** stack-parsers
- [ ] **P4-12** fetch transport
- [ ] **P4-13** 公开 API
- [ ] **P4-14** build + jsdom 测试

## Phase 5 — 数据库

- [ ] **P5-01** Prisma libs/database
- [ ] **P5-02** org / users / projects schema
- [ ] **P5-03** events schema
- [ ] **P5-04** issues schema
- [ ] **P5-05** migration + docker postgres
- [ ] **P5-06** seed DSN

## Phase 6 — backend/dsn

- [ ] **P6-01** Nest 脚手架 + health
- [ ] **P6-02** /health、/ready
- [ ] **P6-03** EnvelopeModule
- [ ] **P6-04** DsnAuthGuard
- [ ] **P6-05** POST envelope
- [ ] **P6-06** event_id 幂等
- [ ] **P6-07** 大小限制 + scrubbing
- [ ] **P6-08** CORS
- [ ] **P6-09** 契约测试

## Phase 7 — backend/monitor

- [ ] **P7-01** Nest 脚手架
- [ ] **P7-02** AuthModule JWT
- [ ] **P7-03** POST /api/auth/login
- [ ] **P7-04** ProjectsModule + DSN
- [ ] **P7-05** GrouperWorker
- [ ] **P7-06** fingerprint upsert
- [ ] **P7-07** GET /api/issues
- [ ] **P7-08** GET /api/issues/:id
- [ ] **P7-09** PATCH issue status
- [ ] **P7-10** grouper golden test
- [ ] **P7-11** Lite all-in-one 文档
- [ ] **P7-12** docker/.env.example

## Phase 8 — frontend/monitor

- [ ] **P8-01** Vite + React 脚手架
- [ ] **P8-02** shadcn/ui
- [ ] **P8-03** API client
- [ ] **P8-04** 登录页
- [ ] **P8-05** Issue 列表
- [ ] **P8-06** Issue 详情
- [ ] **P8-07** VITE_API_URL
- [ ] **P8-08** 路由守卫
- [ ] **P8-09** smoke 测试
- [ ] **P8-10** 生产 build 说明

## Phase 9 — 端到端

- [ ] **P9-01** examples/vanilla
- [ ] **P9-02** docker/compose.yml
- [ ] **P9-03** 根 pnpm dev
- [ ] **P9-04** 手动 E2E 清单
- [ ] **P9-05** CHANGELOG MVP
- [ ] **P9-06** README 快速开始

## Phase 10 — CI 收尾

- [ ] **P10-01** CI packages build + test
- [ ] **P10-02** CI backend test
- [ ] **P10-03** CI frontend build
- [ ] **P10-04** Changesets

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

---

## 手动 E2E 清单（P9-04 填写）

<!-- SDK → DB → UI 验证步骤 -->
