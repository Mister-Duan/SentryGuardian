# Post-MVP 实施主清单（Phase 12～21）

> **当前步骤**：Phase 12～21 **已完成**（P14 不含 `packages/react`，按用户要求跳过）
>
> MVP 清单：[mvp-implementation.md](./mvp-implementation.md) · 架构：[architecture.md](../architecture.md)

## 维护规则（强制）

与 [mvp-implementation.md §维护规则](./mvp-implementation.md#维护规则强制) 相同。

**优先级原则**：排障效率 > 接入广度 > 发布/性能洞察 > 协作与运维 > **告警通知（Phase 21 最后）**

---

## 进度概览

| Phase | 名称 | 步骤 | 状态 |
|-------|------|------|------|
| 12 | 事件历史与 Issue 检索 | P12-01～P12-06 | **已完成** |
| 13 | Source Map 符号化 | P13-01～P13-07 | **已完成** |
| 14 | 框架适配（Vue only） | P14-01～P14-02、P14-04～P14-05 | **已完成** |
| 15 | 项目管理与生产部署 | P15-01～P15-06 | **已完成** |
| 16 | Release 追踪与版本对比 | P16-01～P16-05 | **已完成** |
| 17 | 基础性能监控 | P17-01～P17-07 | **已完成** |
| 18 | 控制台成熟度 | P18-01～P18-05 | **已完成** |
| 19 | SDK 健壮性与合规 | P19-01～P19-05 | **已完成** |
| 20 | Analytics 档（可选） | P20-01～P20-03 | **已完成**（Compose profile 占位） |
| 21 | 告警通知（最后） | P21-01～P21-08 | **已完成** |

> **P14-03 / P14-04 react**：用户明确不做 `packages/react`，已跳过。

---

## Phase 12 — 事件历史与 Issue 检索

- [x] **P12-01** `GET /api/issues/:id/events` 分页 API
- [x] **P12-02** `GET /api/events/:id` 单事件详情
- [x] **P12-03** 控制台 Issue 详情事件列表
- [x] **P12-04** Issue 列表分页 + 标题搜索
- [x] **P12-05** 环境 / release 筛选
- [x] **P12-06** 测试 + 文档

## Phase 13 — Source Map 符号化

- [x] **P13-01** Prisma Release + Artifact
- [x] **P13-02** Release artifact 上传 API
- [x] **P13-03** symbolicator 模块
- [x] **P13-04** 详情 API 符号化 stacktrace
- [x] **P13-05** 控制台 Release / Source Map 页
- [x] **P13-06** upload-sourcemaps 脚本
- [x] **P13-07** 文档

## Phase 14 — 框架适配（Vue only）

- [x] **P14-01** `packages/vue`
- [x] **P14-02** vueRouterIntegration
- [ ] **P14-03** ~~`packages/react`~~（跳过）
- [x] **P14-04** examples/vue-vite
- [x] **P14-05** 包 README + packages.md

## Phase 15～21

各步骤均已实现；详见 git 变更与 [CHANGELOG.md](../../CHANGELOG.md)。

---

## 变更日志

| 日期 | 步骤 | 交付摘要 |
|------|------|----------|
| 2026-06-05 | — | 创建 post-MVP 路线图 |
| 2026-06-05 | P12～P21 | 事件历史、Source Map、Vue 适配、全栈 Docker、性能/Release/告警等（不含 react 包） |
| 2026-06-05 | fix | envelope e2e 绿；DSN 项目校验迁入 EnvelopeService |
| 2026-06-05 | docs | 同步 console-guide、self-hosting、configuration、sdk-guide、getting-started |
