# 核心概念

理解这些术语后，配置项与界面会更容易对上号。

## 成套系统在做什么？

```text
你的 Web 应用出错
    → SDK 采集上下文（堆栈、URL、面包屑）
    → ingest 服务校验并落库
    → Grouper 按指纹合并为 Issue
    → 控制台展示、改状态、排障
```

SentryGuardian 面向**前端错误监控**的 MVP：先做好「错误 → Issue → 人能看到」，性能、告警、会话等为后续阶段。

## Event（事件）

**一次 SDK 上报的记录**，对应数据库 `events` 表中的一行。

- 载荷形态：`ErrorEvent`（见 `packages/types/src/event.ts`）
- 必有：`event_id`（UUID）、`timestamp`、`level`、`sdk`
- 常见内容：`exception`（类型、消息、堆栈）、`breadcrumbs`、`request.url`、`user`

**类比**：日志里的一行错误记录，尚未「合并」。

## Issue（问题）

**多条相似 Event 聚合后的工单**，对应 `issues` 表。

| 字段（API） | 含义 |
|-------------|------|
| `fingerprint` | 聚合指纹（哈希） |
| `title` | 展示标题（多为异常消息） |
| `status` | `unresolved` / `resolved` / `ignored` |
| `event_count` | 合并了多少次事件 |
| `first_seen` / `last_seen` | 首次 / 最近发生时间 |
| `culprit` | 主要来源位置，如 `app.js:42` |

**类比**：Jira 里的一条 Bug，多次重复报错会累加 `event_count`，而不是刷屏 N 条独立 Issue。

## Fingerprint（指纹）

决定「哪些 Event 算同一个 Issue」的键。

MVP 算法（`@sentry-guardian/utils`）：

1. 优先使用事件上的自定义 `fingerprint` 数组
2. 否则取 in-app 栈帧（最多 5 帧），规范化文件名 + 函数名 + 行号后哈希
3. 无堆栈时用 `type|message` 哈希

相同指纹 → 同一 `project_id` 下 upsert 同一 Issue。

## DSN（Data Source Name）

**项目级上报凭证**，嵌入在 SDK 的 `init({ dsn })` 中。

```text
{scheme}://{host}[:port]/api/sentry/{projectId}
```

| 部分 | 谁持有 | 说明 |
|------|--------|------|
| `scheme` | 配置 / seed | 本地回环一般为 `http`；公网 ingest 为 `https` |
| `projectId` | URL 路径 | 数据库项目主键（ingest 路由与鉴权依据） |
| `host` | ingest 服务 | 如 `localhost:3001` 或 `ingest.yourcompany.com` |

控制台用户密码存在 `users` 表，与 DSN **分离**——泄露 DSN 不应能登录后台。

## Envelope（信封）

**SDK 与 ingest 之间的传输格式**：多行文本，每行一个 JSON。

```text
{header JSON}
{item header JSON}
{item payload JSON}
```

MVP 通常一个 Envelope 只带一个 `type: event` 的 item。编解码见 `packages/core/src/envelope.ts`。

## Integration（集成）

SDK 内的插件，在 `init` 时注册，用于：

- 监听 `window.onerror`
- 记录面包屑
- 过滤 URL
- …

浏览器默认集成列表见 [sdk-guide.md](./sdk-guide.md#默认集成)。

## 组织与项目

| 实体 | 说明 |
|------|------|
| **Organization** | 控制台租户边界；MVP 常只有一个默认组织 |
| **Project** | 一个前端应用或环境维度；拥有自己的 DSN |
| **User** | 控制台登录账号，属于某 Organization |

## 与 Sentry 概念对照

| SentryGuardian | Sentry（近似） | 差异提示 |
|----------------|----------------|----------|
| `ErrorEvent` | Error event | 字段子集，见 types 包 |
| `Issue` | Issue | 状态枚举一致 |
| DSN | DSN | URL 格式类似，host 指向自托管 ingest |
| Envelope | Envelope | 行式格式借鉴，Content-Type 自定义 |
| DSN 路径 | Project id in URL | 无独立 Secret key 上报路径（MVP） |

## 下一步

- 这些概念如何串起来：[data-flow.md](./data-flow.md)
- 如何配置 SDK：[sdk-guide.md](./sdk-guide.md) · [configuration.md](../configuration.md)
