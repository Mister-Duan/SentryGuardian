# SentryGuardian

**轻量级前端监控成套系统，专为个人开发者与小企业低成本自托管部署。**

借鉴 [Sentry](https://sentry.io) 的成熟体验，提供从 **浏览器 SDK → 数据接收 → Issue 聚合 → 可视化控制台 → 告警通知** 的完整链路。无需 SaaS 订阅，默认单机即可跑通；业务代码落地中，架构与协作规范已就绪。

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
| **Issue 引擎（monitor）** | 按堆栈指纹聚合重复错误；管理用户、项目、Source Map、告警 |
| **监控控制台** | Issue 列表与详情、性能视图、Release 对比、Source Map 管理 |
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

## 核心能力（规划）

| 阶段 | 能力 |
|------|------|
| **P0** | JS 运行时异常、未捕获 Promise、静态资源加载失败、Issue 聚合 |
| **P1** | 页面加载与 Web Vitals、慢 XHR/fetch、Source Map 定位、Release 对比 |
| **P2** | 会话统计、Webhook/邮件告警、简单 UV/PV（辅助排障，非专业统计） |

- **Issue 聚合**：相同错误自动合并，减少噪音
- **Release 追踪**：按版本对比错误率，辅助发布回归
- **低成本部署**：Lite 档单机 Docker，目标 1C2G 可运行

> **当前状态**：Monorepo 架构与文档已定稿；`packages/`、`apps/` 业务代码尚未落地。MVP 目标见下方「路线图」。

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
├── packages/                 # 可发布 SDK
│   ├── types/                # Event / Issue / Envelope 等协议类型
│   ├── utils/                # 指纹、序列化、脱敏等纯函数
│   ├── core/                 # Client、Scope、Integration、Transport
│   ├── browser-utils/        # 浏览器环境工具（internal）
│   ├── browser/              # 浏览器 SDK 主入口 @sentry-guardian/browser
│   └── vue/                  # Vue 2/3 适配 @sentry-guardian/vue
├── apps/
│   ├── backend/
│   │   ├── dsn/              # Ingest：鉴权、校验、落库
│   │   └── monitor/          # API、Issue 聚合、Source Map、告警
│   └── frontend/
│       └── monitor/          # Web 监控控制台
├── examples/                 # 接入示例（规划）
├── docker/                   # Compose 与镜像（规划）
├── docs/                     # 项目文档
├── AGENTS.md                 # AI 协作入口
└── CHANGELOG.md
```

## 路线图

- [x] 仓库初始化、AI 协作规范、开源交付标准
- [x] 系统架构与 Monorepo 目录定稿（[architecture.md](./docs/architecture.md)）
- [ ] pnpm workspace 与 `packages/types` 脚手架
- [ ] 前端 SDK 最小上报（JS Error → Envelope）
- [ ] backend/dsn 接收与持久化
- [ ] backend/monitor Issue 指纹聚合
- [ ] frontend/monitor Issue 列表与详情 MVP
- [ ] Docker Compose Lite 单机部署
- [ ] 基础告警（Webhook）

**MVP 闭环**：`browser` 捕获错误 → `dsn` 落库 → `monitor` 聚合 Issue → 控制台展示堆栈。

## 快速开始

> SDK 与服务端尚未发布，以下为规划中的接入方式。

```bash
# 安装 SDK（待发布）
pnpm add @sentry-guardian/browser

# Vue 项目额外安装（待发布）
pnpm add @sentry-guardian/vue
```

```javascript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'https://<publicKey>@your-host/api/<projectId>',
  release: '1.0.0',
  environment: 'production',
});
```

自托管部署步骤见 [docs/architecture.md](./docs/architecture.md)（Docker Compose 文档随实现补充）。

## 本地开发

**环境要求**：Node.js 20+、pnpm 10+

```bash
git clone <repo-url> SentryGuardian
cd SentryGuardian
pnpm install

# 文档拼写检查
pnpm spellcheck
```

Monorepo 工程化（workspace、CI、各包 build/test）随 `packages/`、`apps/` 落地后补充。

## 开源承诺

- 代码、文档、协作流程按对外开源要求建设
- 核心逻辑有测试；公开 API 有文档；变更有 [CHANGELOG.md](./CHANGELOG.md)
- 详见 [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md)

## 文档

| 文档 | 说明 |
|------|------|
| [docs/overview.md](./docs/overview.md) | 项目简介、目标用户、路线图 |
| [docs/architecture.md](./docs/architecture.md) | Monorepo 结构、数据流、协议与 MVP 边界 |
| [docs/README.md](./docs/README.md) | 文档中心索引 |
| [AGENTS.md](./AGENTS.md) | AI 协作规范 |
| [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md) | 开源开发标准 |
| [docs/ai-guide/delivery-checklist.md](./docs/ai-guide/delivery-checklist.md) | 交付检查清单 |
| [docs/ai-guide/collaboration.md](./docs/ai-guide/collaboration.md) | 多工具协作说明 |

## AI 协作

本仓库采用 AI 优先的开发流程，并遵循**开源高标准**（测试、文档、Conventional Commits）。开始改动前请先阅读 [AGENTS.md](./AGENTS.md)。

## License

ISC（见 [package.json](./package.json)；LICENSE 文件随首版发布前补充）
