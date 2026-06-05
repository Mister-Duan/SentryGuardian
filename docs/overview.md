# 项目简介

## 是什么

**SentryGuardian** 是一套**轻量级前端监控成套系统**，面向**个人开发者**与**小企业**，支持**低成本自托管部署**。

借鉴 [Sentry](https://sentry.io) 在错误追踪与 Issue 管理上的成熟设计，提供完整闭环：

```text
前端应用 ──SDK 埋点──▶ 接收服务 ──▶ 存储 & 聚合 ──▶ 监控控制台 ──▶ 告警通知
```

与「只提供 SDK」或「只有后台没有 UI」的零散方案不同，SentryGuardian 的目标是：**下载、部署、接入 SDK 后，即可在自有环境中完成前端监控的全流程**。

## 目标用户

### 个人开发者

- 维护个人网站、开源 Demo、Side Project
- 没有专职运维，希望**一台小服务器**搞定监控
- 需要知道「线上到底报错了没有」，而不是等用户反馈

### 小企业 / 小团队

- 前端为主的产品（管理后台、营销站、SaaS 控制台）
- 监控预算有限，不适合按事件量持续付费的 SaaS
- 希望数据**不出内网或自有云**，满足基本合规与掌控感

## 核心价值

| 价值 | 说明 |
|------|------|
| **成套** | SDK + 服务端 + 控制台 + 告警，开箱组成完整方案 |
| **轻量** | 功能聚焦前端监控，不做全栈 APM 大平台 |
| **低成本** | 单机部署、依赖少、资源占用可控 |
| **可自托管** | 无厂商锁定，无按量账单 |
| **易上手** | 接入步骤短，控制台信息架构清晰 |

## 监控范围

### 已实现（MVP + Post-MVP）

| 能力 | 说明 |
|------|------|
| 前端错误 | 运行时异常、Promise rejection、资源加载失败 |
| Vue 3 | `@sentry-guardian/vue`（**不含** `packages/react`） |
| 基础性能 | Web Vitals（LCP/CLS/TTFB）、路由与慢 fetch 事务 |
| Release / Source Map | 版本追踪、artifact 上传、堆栈符号化 |
| 控制台 | Issue 搜索/分页、事件历史、评论、趋势、项目 CRUD |
| 告警 | Webhook（新 Issue、错误率）；邮件为 SMTP 桩 |
| 运维 | ingest 限流、事件 TTL、Docker 全栈 Compose |

### 规划 / 占位

- ClickHouse 分析档（Compose profile 占位）
- `allowed_origins` ingest 校验（字段已入库）
- 专业 UV/PV 分析、Session Replay、Native SDK

## 成套系统架构

```text
                    ┌─────────────────────────────────────┐
                    │           监控控制台 (Web UI)          │
                    │  Issue 列表 · 详情 · 趋势 · 版本对比   │
                    └──────────────────▲──────────────────┘
                                       │ 查询
┌──────────────┐   上报 (HTTP)   ┌─────┴──────┐   聚合    ┌──────────┐
│  业务前端应用  │ ──────────────▶ │  接收 API   │ ────────▶ │  数据库   │
│  + SDK 埋点   │                 │  校验/限流   │         │          │
└──────────────┘                 └─────┬──────┘         └──────────┘
                                       │
                                       ▼
                                 ┌──────────┐
                                 │ 告警模块  │ ──▶ Webhook / 邮件
                                 └──────────┘
```

### 模块职责

| 模块 | 职责 |
|------|------|
| **SDK** | 初始化配置、全局错误监听、上下文采集（URL、UA、Release 等）、批量/节流上报 |
| **接收 API** | 鉴权（Project DSN / Key）、Payload 校验、写入事件流 |
| **聚合引擎** | 堆栈指纹计算、Issue 创建与更新、去重与计数 |
| **控制台** | 项目与 Issue 管理、堆栈可读展示、搜索与筛选 |
| **告警** | 新 Issue、阈值触发等规则，对接外部通知 |

## 低成本部署设计

面向个人与小企业的部署约束：

1. **单机可运行**：接收、API、控制台、定时聚合任务可在同一进程或同一 Compose 栈内完成
2. **最小依赖**：Lite 档默认单 **PostgreSQL** 实例（见 [architecture.md](./architecture.md) §7.3）；Redis 可选（缓存 / 队列），非 MVP 必需；SQLite 仅作远期本地实验选项
3. **低配置友好**：基础版目标 **1 核 2G** 内存可运行
4. **安装简单**：Docker Compose 或单二进制 + 配置文件（规划）
5. **无多租户复杂度**：初期支持单组织 / 少量 Project，满足小企业够用即可

## 与 Sentry 的关系

- **借鉴**：Issue / Event 模型、SDK 上报形态、控制台信息架构、Release 概念
- **差异**：不做全栈 APM、Session Replay、复杂 SaaS 多租户与海量 ingest 集群
- **实现**：本仓库**独立自研**，不 fork Sentry 代码

## 不做 / 延后

- 移动端 Native SDK（iOS / Android 原生）
- 服务端 / 后端 APM 全链路
- 大规模分布式 ingest 集群（单机 symbolicator 已实现）
- 专业级用户行为分析（热力图、录屏等）

## 开源标准

本项目以开源项目的高标准要求开发与协作：

- **质量**：核心逻辑有测试；CI 门禁；lint / typecheck 与本地一致
- **文档**：公开 API、部署步骤、配置项同步维护；变更加入 CHANGELOG
- **协作**：Conventional Commits、SemVer、PR 可审查的小步提交
- **安全**：无密钥入库；依赖许可证审慎；漏洞负责任披露（随 `SECURITY.md` 补充）

AI 开发须完整执行 [delivery-checklist.md](../ai-guide/delivery-checklist.md) 交付闭环，细则见 [open-source.md](../ai-guide/open-source.md)。

## 当前状态

MVP Phase 0～11 与 Post-MVP Phase 12～21 已闭环，详见 [plans/post-mvp-roadmap.md](./plans/post-mvp-roadmap.md)。

| 阶段 | 状态 |
|------|------|
| SDK：`browser` + `vue` | **已完成** |
| 后端 ingest / monitor（含告警、维护） | **已完成** |
| 控制台（Issue/项目/Release/性能/告警） | **已完成** |
| Docker Compose 全栈 | **已完成**（postgres + migrate + dsn + monitor + frontend） |
| `packages/react` | **不实现**（用户决策） |

## 相关文档

- [getting-started.md](./getting-started.md) — 入门指南
- [configuration.md](./configuration.md) — 配置参考
- [learn/README.md](./learn/README.md) — 学习路径
- [README.md](../README.md) — 仓库首页
- [architecture.md](./architecture.md) — 系统架构、Monorepo 与协议
- [packages.md](./packages.md) — 已实现包
- [development.md](./development.md) — 贡献者开发
- [plans/mvp-implementation.md](./plans/mvp-implementation.md) — MVP 实施清单
- [plans/post-mvp-roadmap.md](./plans/post-mvp-roadmap.md) — Post-MVP 路线图
- [AGENTS.md](../AGENTS.md) — AI 协作规范
