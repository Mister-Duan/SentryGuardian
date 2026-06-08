# SentryGuardian

**轻量级前端监控成套系统，专为个人开发者与小企业低成本自托管部署。**

借鉴 [Sentry](https://sentry.io) 的成熟体验，提供从 **浏览器 SDK → 数据接收 → Issue 聚合 → 可视化控制台 → 告警通知** 的完整链路。无需 SaaS 订阅，默认单机即可跑通。

**当前进度**：MVP（Phase 0～10）已闭环——SDK、ingest、Issue 聚合、控制台均可本地运行。详见 [实施计划](./docs/plans/mvp-implementation.md)。

## 一句话介绍

给个人站点、小型 SaaS、内部管理系统装上「看得懂、养得起」的前端监控——知道页面哪里报错、哪里变慢、影响多少用户，并能及时收到通知。

## 适用场景

| 场景 | 典型需求 |
|------|----------|
| **个人开发者** | 博客、作品集、Side Project 线上报错无人知晓 |
| **小型创业团队** | 产品刚上线，需要基础监控但预算有限 |
| **小企业 / 内网系统** | 希望数据留在自己手里，不接受按事件量付费 |
| **前端为主的应用** | SPA、H5、小程序 WebView 等需要 JS 异常与性能观测 |

## 成套系统包含什么

SentryGuardian 不是单一 SDK 或单一后台，而是一套可独立部署的**前端监控解决方案**：

```text
┌─────────────────────────────────────────────────────────────┐
│                    SentryGuardian 成套系统                    │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  前端 SDK     │  接收服务     │  控制台 UI    │  告警通知        │
│  埋点 / 上报   │  清洗 / 存储  │  Issue / 趋势 │  Webhook / 邮件  │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

| 模块 | 说明 |
|------|------|
| **前端 SDK** | 接入 Web 应用，采集 JS 异常、Promise 拒绝、资源加载失败、基础性能指标 |
| **接收服务（dsn）** | Ingest 网关：DSN 鉴权、校验、限流，写入 Event 明细 |
| **Issue 引擎（monitor）** | 按堆栈指纹聚合重复错误；符号化堆栈；管理用户、项目、Source Map、告警 |
| **监控控制台** | Issue 列表与详情（In App / Library 标签）、性能视图、Release 与 artifact 管理、源码上下文 |
| **告警通道** | 新 Issue、错误激增等场景的轻量通知（可选配置） |

### 数据流（概要）

```text
业务应用 + SDK ──Envelope──▶ backend/dsn ──▶ Event 明细（PG 或 ClickHouse）
                                    │
                                    └──▶ Issue / 业务元数据（PostgreSQL）
                                              │
                                              ▼
                                    backend/monitor ──▶ frontend/monitor
```

- **Event**：每一次 SDK 上报的原始记录（日志流水）。
- **Issue**：相同错误合并后的一条「工单」，便于在控制台查看与处理。
- **元数据**：用户、项目、DSN Key、Release、Source Map、告警规则等管理数据。

详见 [docs/architecture.md](./docs/architecture.md)。

## 核心能力

| 类别 | 能力 |
|------|------|
| **错误监控** | JS 运行时异常、未捕获 Promise、资源/CSP/HTTP 失败、`console.error` |
| **Issue 聚合** | 堆栈指纹合并；列表/详情展示 culprit **In App** / **Library** 标签 |
| **性能** | Web Vitals（LCP/CLS/TTFB 等）、慢 fetch、perfume.js 字段指标（子路径按需引入） |
| **Release & Source Map** | 版本追踪；上传 map 后堆栈符号化；Issue 详情 ±5 行源码上下文 |
| **框架** | `@sentry-guardian/vue`（Vue 3）；`@sentry-guardian/vite-plugin` 构建后自动上传 map |
| **控制台** | Issue 搜索/筛选/趋势、事件历史、评论、Release 对比、性能图表 |
| **告警 & 运维** | Webhook；ingest 限流；事件 TTL；Docker Lite 全栈 |

- **Release 追踪**：按版本对比错误率，辅助发布回归
- **低成本部署**：Lite 档单机 Docker，目标 1C2G 可运行

> **当前状态**：MVP + Post-MVP 主链路已落地。包清单见 [docs/packages.md](./docs/packages.md)；分步计划见 [docs/plans/mvp-implementation.md](./docs/plans/mvp-implementation.md)。

## 为什么选择 SentryGuardian

| 对比维度 | 商业 SaaS（如 Sentry 云版） | SentryGuardian |
|----------|------------------------------|----------------|
| 费用 | 按事件量 / 席位付费 | **自托管，无按量账单** |
| 部署 | 开箱即用 | **单机即可，运维简单** |
| 数据 | 托管在第三方 | **数据留在自有环境** |
| 功能广度 | 全栈 APM、丰富集成 | **聚焦前端监控核心链路** |
| 体量 | 面向中大型团队 | **个人 / 小企业够用即可** |

设计原则：**借鉴 Sentry 的产品思路，在本仓库独立实现**；以**开源高标准**建设——可测试、可文档化、社区可贡献；不做 fork，不引入不必要的分布式复杂度。

## 部署档位

同一套代码，通过配置切换两档部署（默认 **Lite**）：

| 档位 | 适用场景 | Event 明细 | Issue / 元数据 | 目标资源 |
|------|----------|------------|----------------|----------|
| **Lite**（默认） | 个人站、日活万级以内 | PostgreSQL | 同库 | 1C2G |
| **Analytics** | 需高性能时序分析 | ClickHouse | PostgreSQL | 2C4G+ |

- **Lite**：依赖最少，`dsn` 与 `monitor` 可合并单进程；无 ClickHouse。
- **Analytics**：`dsn` 高吞吐写 ClickHouse；`monitor` 负责聚合与查询 API。
- Docker Compose 规划：`docker compose up`（Lite）/ `docker compose --profile analytics up`（Analytics）。

## Monorepo 结构

```text
SentryGuardian/
├── packages/
│   ├── types/                # ✅ 协议类型
│   ├── utils/                # ✅ 指纹、序列化、脱敏
│   ├── core/                 # ✅ SDK 内核
│   ├── browser-utils/        # ✅ 内部：getFetch
│   ├── browser/              # ✅ 浏览器 SDK（含 ./performance、./tracing 子路径）
│   ├── vue/                  # ✅ Vue 3 适配
│   └── vite-plugin/          # ✅ 构建后上传 Source Map
├── apps/
│   ├── backend/dsn           # ✅ Ingest（3001）
│   ├── backend/monitor       # ✅ API + Grouper + Symbolicator（3002）
│   └── frontend/monitor      # ✅ React 控制台（5173）
├── examples/
│   ├── vanilla/              # ✅ 原生 JS + 性能 / Source Map 演示
│   └── vue-vite/             # ✅ Vue 3 集成演示
├── docker/compose.yml        # ✅ PostgreSQL
├── scripts/upload-sourcemaps.mjs  # ✅ CI / 手动上传 Source Map
├── docs/                     # 项目文档
├── AGENTS.md
└── CHANGELOG.md
```

## 路线图

与 [docs/plans/mvp-implementation.md](./docs/plans/mvp-implementation.md) 同步：

- [x] 工程底座（workspace、CI、lint、测试）
- [x] `@sentry-guardian/types` 协议类型
- [x] `@sentry-guardian/utils` 工具函数
- [x] `@sentry-guardian/core` SDK 内核
- [x] `@sentry-guardian/browser` 浏览器 SDK（Phase 4）
- [x] `@sentry-guardian/database` + Docker Postgres（Phase 5）
- [x] backend/dsn ingest（Phase 6）
- [x] backend/monitor Issue 聚合 + API（Phase 7）
- [x] frontend/monitor 控制台 MVP（Phase 8）
- [x] 端到端示例与 `pnpm dev`（Phase 9）
- [x] CI 分包构建 / Changesets（Phase 10）
- [x] Post-MVP Phase 12～21（事件历史、Source Map、Vue 适配、性能、告警等；不含 `packages/react`）

**MVP 闭环**：`browser` 捕获错误 → `dsn` 落库 → `monitor` 聚合 Issue → 控制台展示堆栈。

## 快速开始（本地 Lite）

```bash
git clone <repo-url> SentryGuardian && cd SentryGuardian
pnpm install && pnpm build

cp .env.example .env
docker compose -f docker/compose.yml up -d postgres
pnpm --filter @sentry-guardian/database db:migrate
pnpm --filter @sentry-guardian/database db:seed   # 记下输出的 DSN

# 三服务并行 + 热重启（推荐）
pnpm dev
# 若同时改 packages/* SDK：pnpm dev:full

# 或分终端：
pnpm --filter @sentry-guardian/backend-dsn dev      # :3001
pnpm --filter @sentry-guardian/backend-monitor dev  # :3002
pnpm --filter @sentry-guardian/frontend-monitor dev # :5173
```

控制台：`http://localhost:5173` · 默认账号 `admin@localhost` / `adminadmin`

SDK 接入（monorepo 内）：

```javascript
import * as Sentry from '@sentry-guardian/browser';
// 性能指标按需从子路径引入（减小主包体积）：
// import { performanceIntegration } from '@sentry-guardian/browser/performance';
// import { browserTracingIntegration } from '@sentry-guardian/browser/tracing';

Sentry.init({
  dsn: 'http://localhost:3001/api/sentry/envelope/<projectId>',
  environment: 'production',
  release: 'my-app@1.0.0', // 与 Source Map 上传的 release 一致
});
```

**Source Map（可选）**：构建产物带 `sourcemap: true` 后，用 `@sentry-guardian/vite-plugin` 或 `pnpm upload-maps` 上传到控制台；详见 [docs/learn/source-map-guide.md](./docs/learn/source-map-guide.md)。

示例页：`examples/vanilla`（:5174）、`examples/vue-vite` · 分步说明见 [docs/getting-started.md](./docs/getting-started.md) · 配置查 [docs/configuration.md](./docs/configuration.md)。

## 本地开发

**环境要求**：Node.js 20+、pnpm 10+

```bash
git clone <repo-url> SentryGuardian
cd SentryGuardian
pnpm install
pnpm build    # 构建全仓 workspace
pnpm test     # 全仓测试
pnpm lint
pnpm spellcheck
```

完整说明见 [docs/development.md](./docs/development.md)。

## 开源承诺

- 代码、文档、协作流程按对外开源要求建设
- 核心逻辑有测试；公开 API 有文档；变更有 [CHANGELOG.md](./CHANGELOG.md)
- 详见 [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md)

## 文档

| 文档 | 说明 |
|------|------|
| [docs/getting-started.md](./docs/getting-started.md) | **入门**：30 分钟本地跑通 |
| [docs/configuration.md](./docs/configuration.md) | **配置**：环境变量、DSN、SDK、API |
| [docs/learn/source-map-guide.md](./docs/learn/source-map-guide.md) | **Source Map**：上传、符号化、控制台源码面板 |
| [docs/learn/README.md](./docs/learn/README.md) | **学习路径**与概念、数据流、自托管 |
| [docs/overview.md](./docs/overview.md) | 项目简介、目标用户、路线图 |
| [docs/architecture.md](./docs/architecture.md) | Monorepo 结构、协议与 MVP 边界 |
| [docs/packages.md](./docs/packages.md) | 已实现 npm 包 |
| [docs/development.md](./docs/development.md) | 贡献者：构建、测试命令 |
| [docs/plans/mvp-implementation.md](./docs/plans/mvp-implementation.md) | MVP 实施清单 |
| [docs/README.md](./docs/README.md) | 文档中心索引 |
| [AGENTS.md](./AGENTS.md) | AI 协作规范 |
| [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md) | 开源开发标准 |
| [docs/ai-guide/delivery-checklist.md](./docs/ai-guide/delivery-checklist.md) | 交付检查清单 |
| [docs/ai-guide/collaboration.md](./docs/ai-guide/collaboration.md) | 多工具协作说明 |

## AI 协作

本仓库采用 AI 优先的开发流程，并遵循**开源高标准**（测试、文档、Conventional Commits）。开始改动前请先阅读 [AGENTS.md](./AGENTS.md)。

## License

ISC（见 [package.json](./package.json)；LICENSE 文件随首版发布前补充）
