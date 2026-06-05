# packages 源码入门（小白向）

本文专门讲 **`packages/` 目录**：五个 npm 包各自干什么、数据怎么从左边的网页流到右边的数据库，以及**每个重要字段是干什么的、谁会用到**。

如果你只想「先跑起来」，请看 [getting-started.md](../getting-started.md)。  
如果已经懂 Event / Issue 概念，想对照术语，请看 [concepts.md](./concepts.md) 与 [data-flow.md](./data-flow.md)。

---

## 1. 用一句话理解 packages

`packages/` 里是 **前端监控 SDK 的源代码**，负责：

1. 在浏览器里**听到**错误（`window.onerror` 等）
2. 把错误整理成一份 **JSON 报告**（`ErrorEvent`）
3. 装进 **信封**（`Envelope`）用 HTTP 发给自家服务器

**不负责**登录控制台、查 Issue 列表、写数据库——那些在 `apps/backend` 和 `apps/frontend`。  
但 SDK 和后端 **共用同一套类型定义**（`packages/types`），所以字段名对得上。

---

## 2. 五个包的关系（先记这张图）

```text
                    ┌─────────────────────────────────────┐
                    │         packages/types               │
                    │  ErrorEvent / Envelope / Issue …     │
                    │  （只有类型，没有运行时代码）           │
                    └───────────────▲─────────────────────┘
                                    │ 大家都 import 它
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────┴─────────┐   ┌───────┴───────┐   ┌────────┴────────┐
    │  packages/utils    │   │ packages/core │   │ apps/backend    │
    │  指纹、脱敏、序列化  │   │ Client/Scope  │   │ 也用 types/utils│
    └─────────▲─────────┘   │ Transport…    │   └─────────────────┘
              │               └───────▲───────┘
              │                       │
              │               ┌───────┴───────────┐
              │               │ browser-utils     │  （内部用，不单独卖）
              │               │ 取 window.fetch   │
              │               └───────▲───────────┘
              │                       │
              └───────────────────────┤
                              ┌───────┴────────┐
                              │ packages/browser│  ← 业务项目 npm install 这个
                              │ init、集成、上报 │
                              └────────────────┘
```

**依赖顺序（构建时要先编前面的）：**

```text
types → utils → core → browser-utils → browser
```

**业务项目只需要安装：**

```bash
pnpm add @sentry-guardian/browser
```

---

## 3. 从用户点击到控制台：完整流程

下面用「用户点了按钮，页面报错」走一遍，对应源码位置。

### 第 0 步：你在页面里初始化 SDK

```javascript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'http://你的publicKey@localhost:3001/api/项目ID',
  environment: 'production',
});
```

| 你写的配置 | 源码位置 | 作用 |
|-----------|----------|------|
| `dsn` | `browser/src/sdk.ts` → `parseDsn()` | 解析出上报 URL 和 publicKey |
| `environment` 等 | 传给 `BrowserClient` → `core/src/client.ts` | 写进每条 `ErrorEvent` |

`init` 会做三件事（简化理解）：

1. 创建 **`BrowserClient`**（真正干活的客户端）
2. 挂上 **默认集成**（监听全局错误、记面包屑等）——`browser/src/default-integrations.ts`
3. 创建 **发送管道**：`BufferTransport` 包一层 `FetchTransport`——出错时 POST 到 ingest

### 第 1 步：集成捕获错误

例如用户点击触发 `throw new Error('…')`，`GlobalHandlers` 集成会接到：

| 文件 | 做什么 |
|------|--------|
| `browser/src/integrations/global-handlers.ts` | 监听 `window.onerror`、未处理的 Promise |
| `browser/src/client.ts` | 把 `Error` 转成带堆栈的 `exception` |
| `browser/src/stack-parser.ts` | 把 `error.stack` 字符串解析成 `StackFrame[]` |

然后调用 **`Client.captureException()`**（`core/src/client.ts`）。

### 第 2 步：Client 组装 ErrorEvent

在 `core/src/client.ts` 里大致顺序是：

```text
生成 event_id
  → 合并 Scope 里的 user / tags / breadcrumbs
  → 检查 sampleRate（采样）、ignoreErrors、2 秒内 dedupe
  → 走 beforeSend 链（集成可丢弃事件）
  → createEnvelope([event]) 打包
  → transport.send(envelope)
```

| 模块 | 文件 | 小白理解 |
|------|------|----------|
| **Scope** | `core/src/scope.ts` | 当前页面的「上下文笔记本」：用户是谁、标签、操作轨迹 |
| **EventProcessor** | `core/src/event-processor.ts` | `beforeSend` 过滤器链 |
| **Envelope** | `core/src/envelope.ts` | 把 JSON 变成「多行文本」线上格式 |
| **BufferTransport** | `core/src/transports/buffer.ts` | 排队、失败重试、429 退避 |
| **FetchTransport** | `browser/src/transports/fetch.ts` | 真正 `fetch POST` |

### 第 3 步：HTTP 发到后端（不在 packages 里，但要心里有数）

```http
POST http://localhost:3001/api/{projectId}/envelope/
Content-Type: application/x-sentry-guardian-envelope
X-Sentry-Guardian-Public-Key: {publicKey}
```

实现：`apps/backend/dsn/`。  
packages 只负责 **发出**；**接收、入库、聚合成 Issue** 在 apps。

### 第 4 步：控制台看到 Issue（同样不在 packages）

Grouper 用 `utils` 里的 **`computeFingerprint`** 决定多条 Event 是否合并成一个 Issue。  
你在控制台看到的 `title`、`culprit`、`event_count` 都来自后端，但字段定义在 **`types/src/issue.ts`**。

---

## 4. 每个包该读什么文件？

### 4.1 `packages/types` — 协议字典

**没有 `.js` 运行逻辑**，全是 TypeScript 类型。改字段要先改这里，再改 SDK / 后端。

| 文件 | 内容 |
|------|------|
| `src/event.ts` | **`ErrorEvent`**：一条上报长什么样 |
| `src/envelope.ts` | **`Envelope`**：线上传输格式 |
| `src/issue.ts` | **`Issue`**：控制台里的一条「问题」 |
| `src/breadcrumb.ts` | 面包屑 |
| `src/stack.ts` | 堆栈帧 |
| `src/api.ts` | 控制台 REST 的请求/响应形状 |

### 4.2 `packages/utils` — 纯工具函数

| 文件 | 谁用 | 做什么 |
|------|------|--------|
| `fingerprint.ts` | 后端 Grouper | 算 Issue 指纹（相同错误合并） |
| `scrub.ts` | 后端 ingest | 脱敏 password、token 等 |
| `serialize.ts` | SDK 面包屑等 | 安全 JSON 化，防循环引用 |
| `string.ts` | SDK Client | 时间戳规范化、字符串截断 |

### 4.3 `packages/core` — SDK 大脑（不碰 DOM）

| 文件 | 入口/核心 |
|------|-----------|
| `sdk.ts` | `init` / `getClient` / `captureException`（非浏览器版） |
| `client.ts` | **`Client`**：`captureException`、`sampleRate`、dedupe |
| `scope.ts` | **`Scope`**：`setUser`、`setTag`、`addBreadcrumb` |
| `integration.ts` | 集成插件接口 |
| `envelope.ts` | `createEnvelope` / `serializeEnvelope` |
| `dsn.ts` | `parseDsn`、`generateEventId` |
| `transports/` | 发送抽象 + 缓冲重试 |

### 4.4 `packages/browser-utils` — 内部小工具

| 文件 | 作用 |
|------|------|
| `fetch.ts` | `getFetch()`：拿到绑定了 `globalThis` 的 `fetch` |

业务方**不用**直接依赖这个包。

### 4.5 `packages/browser` — 你 npm install 的包

| 文件 | 作用 |
|------|------|
| **`sdk.ts`** | **`init` 入口**、全局 `captureException` |
| `client.ts` | `BrowserClient`：解析 stack、展开 `Error.cause` |
| `default-integrations.ts` | 默认集成列表 |
| `integrations/*.ts` | 各插件：全局错误、面包屑、URL 过滤… |
| `transports/fetch.ts` | 浏览器 POST |
| `stack-parser.ts` | Chrome/Firefox 堆栈字符串解析 |

**建议阅读顺序：**

```text
browser/src/sdk.ts
  → browser/src/client.ts
  → core/src/client.ts
  → core/src/scope.ts
  → types/src/event.ts
  → core/src/envelope.ts
  → browser/src/integrations/global-handlers.ts（任选一个集成）
```

---

## 5. 字段说明：谁填、谁用、什么意思？

下面按「数据结构」分组。  
**谁填**：一般是 SDK 在浏览器里自动填；你也可以 `setUser` / `setTag` 手动填。  
**谁用**：ingest 存库、Grouper 聚合、控制台展示。

### 5.1 ErrorEvent — 一条错误报告（最核心）

定义：`packages/types/src/event.ts`

| 字段 | 谁填 | 谁用 | 通俗解释 |
|------|------|------|----------|
| `event_id` | SDK | ingest 幂等、去重 | 这条报告的唯一编号（UUID），重试不会插两条 |
| `timestamp` | SDK | 排序、展示时间 | 什么时候出的错 |
| `platform` | SDK | 筛选 | 固定 `javascript`（浏览器） |
| `level` | SDK | Issue 严重度 | `error` / `warning` / `info` 等 |
| `release` | 你配 `init({ release })` | 按版本对比（规划） | 例如 `1.2.3` 或 git commit |
| `environment` | 你配 `init({ environment })` | 区分 prod/staging | 例如 `production` |
| `exception` | SDK | 堆栈展示、指纹 | 异常类型、消息、栈帧列表 |
| `message` | SDK（`captureMessage`） | 标题 | 没有 exception 时的纯文本错误 |
| `request` | 集成 `httpContext` | URL 过滤、排障 | 当前页面 URL、部分请求头 |
| `user` | 你 `setUser` 或集成 | 影响用户数统计 | 哪个用户遇到的（可脱敏） |
| `tags` | 你 `setTag` | 控制台筛选（规划） | 键值标签，如 `page:checkout` |
| `extra` | 你 `setExtra` | 详情里看诊断信息 | 任意 JSON，别放密码 |
| `breadcrumbs` | 集成 `breadcrumbs` | 还原操作路径 | 出错前点了什么、控制台打了什么 |
| `sdk` | SDK | 排查 SDK 版本问题 | 包名 + 版本号 |
| `fingerprint` | 你可选设置 | **Grouper 合并 Issue** | 自定义「算同一类 Bug」的键，不设则用栈哈希 |

#### exception 里面有什么？

| 字段 | 含义 |
|------|------|
| `values[]` | 一条或多条异常（`Error.cause` 链展开时有多条） |
| `values[].type` | 如 `TypeError` |
| `values[].value` | 错误消息文案 |
| `values[].stacktrace.frames` | 堆栈帧数组，见下表 |
| `values[].mechanism.type` | 谁捕获的：`onerror`、`onunhandledrejection`、手动等 |
| `values[].mechanism.handled` | 业务是否已经 catch 过 |

#### StackFrame — 堆栈的一行

定义：`packages/types/src/stack.ts`

| 字段 | 含义 |
|------|------|
| `filename` | 哪个文件，可能是 URL |
| `function` | 函数名 |
| `lineno` / `colno` | 行号、列号 |
| `in_app` | 是不是你自己项目的代码（过滤 node_modules） |

#### Breadcrumb — 出错前的操作记录

| 字段 | 含义 |
|------|------|
| `timestamp` | 发生时间（秒） |
| `category` | 分类：`console`、`navigation`、`xhr`… |
| `message` | 简短描述 |
| `level` | 严重程度 |
| `data` | 额外结构化信息 |

#### User — 用户上下文

| 字段 | 含义 | 隐私注意 |
|------|------|----------|
| `id` | 你业务里的用户 ID | 默认会保留 |
| `email` / `username` | 登录信息 | 需 `sendDefaultPii: true` 才会上报 |
| `ip_address` | IP | 同上 |

---

### 5.2 Envelope — 线上传输的「信封」

定义：`packages/types/src/envelope.ts`  
编解码：`packages/core/src/envelope.ts`

线上长这样（每一行是一个 JSON）：

```text
第 1 行：信封头 EnvelopeHeader（sdk 名、发送时间）
第 2 行：条目头 EnvelopeItemHeader（type: "event"）
第 3 行：条目内容 = 整个 ErrorEvent 的 JSON
```

| 字段 | 含义 |
|------|------|
| `header.sdk` | 哪个 SDK 发的 |
| `header.sent_at` | 发送时间 |
| `items[].header.type` | MVP 基本是 `event` |
| `items[].payload` | 真正的 `ErrorEvent` 对象 |

---

### 5.3 Issue — 控制台里的一条「问题」

定义：`packages/types/src/issue.ts`  
**不是 SDK 直接上报的**，是后端把很多 Event 合并后的结果。

| 字段 | 谁生成 | 通俗解释 |
|------|--------|----------|
| `id` | 数据库 | Issue 主键 |
| `project_id` | 数据库 | 属于哪个项目 |
| `fingerprint` | Grouper（`computeFingerprint`） | 相同指纹的 Event 进同一条 Issue |
| `title` | Grouper（通常取异常消息） | 列表上看到的标题 |
| `status` | 你在控制台改 | 未解决 / 已解决 / 已忽略 |
| `level` | Grouper | 该 Issue 最高严重级别 |
| `first_seen` / `last_seen` | Grouper | 第一次 / 最近一次出错时间 |
| `event_count` | Grouper 累加 | 合并了多少次上报 |
| `users_seen` | Grouper 累加 | 多少不同用户遇到过 |
| `culprit` | Grouper（栈顶 in-app 帧） | 如 `app.js:42`，快速定位文件行 |

---

### 5.4 DSN — 上报地址（不是 ErrorEvent 字段，但必配）

格式：

```text
{scheme}://{publicKey}@{host}/api/{projectId}
```

| 部分 | 含义 |
|------|------|
| `publicKey` | 项目公钥，HTTP 头 `X-Sentry-Guardian-Public-Key` |
| `projectId` | 项目 ID，URL 路径里 |
| `host` | ingest 服务地址 |

解析逻辑：`packages/core/src/dsn.ts` 的 `parseDsn()`。  
本地 `localhost` 即使用 `https` 写 DSN，也会自动改成 **`http`** 上报，避免本机证书问题。

---

## 6. 你能在 init 里配什么？（SDK 配置 → 源码）

`BrowserInitOptions`：`packages/browser/src/sdk.ts`  
继承自 `ClientOptions`：`packages/core/src/client.ts`

| 配置项 | 默认值（大致） | 作用 |
|--------|----------------|------|
| `dsn` | 必填 | 上报到哪 |
| `environment` | `production` | 打在每条 Event 上 |
| `release` | 无 | 版本标记 |
| `sampleRate` | `1` | `0~1`，随机丢弃一部分事件 |
| `sendDefaultPii` | `false` | 是否上报邮箱、IP 等 |
| `maxBreadcrumbs` | `100` | 最多保留多少条面包屑 |
| `ignoreErrors` | 无 | 消息匹配则不上报 |
| `denyUrls` / `allowUrls` | 无 | 按页面 URL 过滤 |
| `beforeSend` | 无 | 发送前改 Event 或返回 `null` 丢弃 |
| `defaultIntegrations` | `true` | 设为 `false` 则不挂默认插件 |
| `integrations` | 无 | 追加自定义集成 |
| `transport` | Fetch+Buffer | 高级：换掉发送实现（测试常用 Mock） |
| `linkedErrors` | `true` | 是否展开 `Error.cause` 链 |

默认集成一览（`getDefaultIntegrations`）：

| 集成名 | 作用 |
|--------|------|
| InboundFilters | denyUrls / allowUrls |
| Dedupe | 占位；实际 dedupe 在 Client 内 |
| GlobalHandlers | 全局未捕获错误 |
| HttpContext | 当前页面 URL |
| LinkedErrors | cause 链（BrowserClient 解析栈） |
| Breadcrumbs | console、点击等轨迹 |
| BrowserApiErrors | 脚本/图片加载失败 |

---

## 7. 和 `apps/` 怎么衔接？

```text
packages/browser  ──POST Envelope──▶  apps/backend/dsn
                                           │
                                           ▼
                                    PostgreSQL.events
                                           │
                                           ▼
                                    apps/backend/monitor (Grouper)
                                           │
                                           ▼
                                    PostgreSQL.issues
                                           │
                                           ▼
                                    apps/frontend/monitor (读 API 展示)
```

| 你想改… | 去哪个目录 |
|---------|-----------|
| 多采集一种浏览器错误 | `packages/browser/src/integrations/` |
| 改上报格式 | `packages/types` + `packages/core/src/envelope.ts` + `apps/backend/dsn` |
| 改 Issue 合并规则 | `packages/utils/src/fingerprint.ts` + `apps/backend/monitor/src/grouper/` |
| 改控制台列表字段 | `packages/types/src/issue.ts` + `apps/frontend/monitor/` |

---

## 8. 本地调试 packages 的小技巧

1. **改 types 后要先 build**  
   ```bash
   pnpm --filter @sentry-guardian/types build
   pnpm --filter @sentry-guardian/core build
   pnpm --filter @sentry-guardian/browser build
   ```

2. **用示例项目试**  
   `examples/vanilla/`：`VITE_DSN=... pnpm dev`，点按钮抛错。

3. **单测入口**  
   ```bash
   pnpm --filter @sentry-guardian/core test
   pnpm --filter @sentry-guardian/browser test
   ```

4. **看类型提示**  
   构建后的 `packages/browser/dist/index.d.ts` 里能看到带注释的 API（源码注释在 `src/`）。

5. **Mock 不发网络**  
   `init({ transport: new MockTransport({ url: '...' }) })` 后看 `transport.sent` 里有没有 Envelope。

---

## 9. 常见疑问（FAQ）

**Q：为什么分 core 和 browser 两个包？**  
A：`core` 不依赖 `window`，方便单测和以后做 Node SDK；`browser` 只管浏览器特有的事（fetch、onerror、堆栈解析）。

**Q：Event 和 Issue 有什么区别？**  
A：Event = 每一次上报；Issue = 很多相似 Event 合并成的一条「工单」。SDK 只产生 Event。

**Q：为什么控制台看到的字段比 ErrorEvent 多？**  
A：Issue 是后端聚合表；`event_count`、`status` 等是服务端算的，不在 SDK payload 里。

**Q：注释在哪里看最全？**  
A：源码 `packages/*/src/**/*.ts` 里的 JSDoc（中英双语）；规范见 [doc-comments.md](../ai-guide/doc-comments.md)。

---

## 10. 下一步读什么？

| 目标 | 文档 |
|------|------|
| 概念速查 | [concepts.md](./concepts.md) |
| 端到端时序 | [data-flow.md](./data-flow.md) |
| 接入参数详解 | [sdk-guide.md](./sdk-guide.md) |
| 包清单与构建 | [packages.md](../packages.md) |
| 贡献者命令 | [development.md](../development.md) |

---

*文档与 `packages/` 源码同步维护；若字段有增删，请同时更新 `packages/types` 与本文第 5 节。*
