# 学习路径

按角色与深度组织的阅读顺序。每篇均可独立查阅，建议从上到下第一次通读。

## 我是谁？读什么？

| 角色 | 目标 | 推荐阅读 |
|------|------|----------|
| **业务前端** | 在页面里接入监控 | [入门](../getting-started.md) → [SDK 指南](./sdk-guide.md) → [配置：SDK](../configuration.md#sdk-sentry-guardianbrowser) |
| **运维 / 自托管** | 部署一套 Lite 环境 | [入门](../getting-started.md) → [自托管](./self-hosting.md) → [配置：环境变量](../configuration.md#环境变量) |
| **后端开发** | 理解 ingest 与聚合 | [核心概念](./concepts.md) → [数据流](./data-flow.md) → [architecture.md](../architecture.md) |
| **产品 / 测试** | 用控制台排障 | [入门](../getting-started.md) → [控制台指南](./console-guide.md) |
| **贡献者** | 改 Monorepo 代码 | [development.md](../development.md) → [architecture.md](../architecture.md) → [packages.md](../packages.md) |

## 推荐学习顺序（约 2～3 小时）

```text
1. 核心概念 (concepts)     ← Event、Issue、DSN、Envelope 是什么
2. 数据流 (data-flow)      ← 从点击到控制台的一条线
3. 动手：getting-started   ← 本地跑通
4. SDK 指南 (sdk-guide)    ← init、集成、手动上报
5. 控制台 (console-guide)  ← 登录、Issue、状态
6. 配置参考 (configuration) ← 查表
7. 自托管 (self-hosting)   ← 生产注意点（需要时）
```

## 文档地图

| 文档 | 内容 |
|------|------|
| [concepts.md](./concepts.md) | 领域模型与术语 |
| [data-flow.md](./data-flow.md) | 端到端数据流与幂等 |
| [sdk-guide.md](./sdk-guide.md) | 浏览器 SDK 使用详解 |
| [console-guide.md](./console-guide.md) | 监控控制台与 REST API |
| [self-hosting.md](./self-hosting.md) | Lite 部署与运维 |

## 与 Sentry 的关系

SentryGuardian **借鉴** Sentry 的 DSN、Envelope、Issue 等产品概念，但是**独立实现**的轻量自托管方案，API 与配置项并不与 Sentry SaaS 兼容。若你熟悉 Sentry，可对照 [concepts.md](./concepts.md) 中的「对照表」快速迁移心智模型。

## 源码入口（阅读代码时）

| 主题 | 路径 |
|------|------|
| 协议类型 | `packages/types/` |
| SDK 内核 | `packages/core/` |
| 浏览器 SDK | `packages/browser/` |
| Ingest | `apps/backend/dsn/` |
| 聚合与 API | `apps/backend/monitor/` |
| 控制台 UI | `apps/frontend/monitor/` |
| 数据库 | `apps/backend/libs/database/prisma/schema.prisma` |
