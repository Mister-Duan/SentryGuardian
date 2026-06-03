# 系统架构

本文描述 SentryGuardian 的 **Monorepo 目录结构**、**模块职责**、**数据流**、**核心协议**与 **MVP 边界**。产品定位与路线图见 [overview.md](./overview.md)。

> **状态**：架构草稿，随实现迭代更新。仓库内 `awesome/` 为 Sentry 参考代码（gitignore），**不参与构建与发布**。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **成套闭环** | SDK → Ingest → 存储 → 聚合 → 控制台 → 告警，一条链路可自托管跑通 |
| **分层清晰** | SDK 内核与运行环境解耦；Ingest 与查询/业务 API 分离 |
| **轻量优先** | 默认单机可部署；重型组件（ClickHouse、Kafka）仅在「分析版」启用 |
| **借鉴不复制** | 参考 Sentry 的 Issue / Envelope / Integration 模型，在本仓库独立实现 |
| **协议共享** | Event、Issue、Envelope 等类型由 `packages/types` 定义，SDK 与 Backend 共用 |

---

## 2. 总体架构

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         业务前端应用 + SDK                                │
│  @sentry-guardian/browser  (+ 可选 @sentry-guardian/vue)                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP POST Envelope
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  apps/backend/dsn          Ingest 网关（鉴权 · 校验 · 限流 · 落库）        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
     ┌─────────────────┐                 ┌─────────────────┐
     │  Event 明细存储   │                 │  元数据 / Issue  │
     │  (ClickHouse 或   │                 │  (PostgreSQL)    │
     │   PG 轻量版)      │                 │                  │
     └────────┬─────────┘                 └────────┬─────────┘
              │                                    │
              └─────────────────┬──────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  apps/backend/monitor      查询 API · Issue 聚合 · Source Map · 告警      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST / GraphQL
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  apps/frontend/monitor     监控控制台（Issue · 性能 · Source Map UI）     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 部署档位

为兼顾 [overview.md](./overview.md) 中的「低成本单机」与大规模 Event 分析需求，提供两档部署（**同一代码库，配置切换**）：

| 档位 | 适用场景 | Event 存储 | Issue / 用户元数据 | 目标资源 |
|------|----------|------------|-------------------|----------|
| **Lite** | 个人站、日活万级以内 | PostgreSQL（JSONB 或分区表） | 同库不同 schema | 1C2G |
| **Analytics** | 小企业、需高性能时序查询 | ClickHouse | PostgreSQL | 2C4G+ |

- **Lite**：`dsn` 与 `monitor` 可合并为单进程，无 ClickHouse 依赖。
- **Analytics**：`dsn` 专注高吞吐写入 ClickHouse；`monitor` 负责聚合 worker 与查询 API。
- 文档与 Compose 以 **Lite 为默认**，Analytics 作为可选 profile（`docker compose --profile analytics`）。

---

## 3. Monorepo 目录结构

```text
SentryGuardian/
├── packages/                    # 可发布 npm 包
│   ├── types/                   # 跨端协议类型（Event / Issue / Envelope / API DTO）
│   ├── utils/                   # 纯函数：指纹、序列化、裁剪、脱敏、时间
│   ├── core/                    # SDK 内核（无 DOM / 无 Node 专有 API）
│   ├── browser-utils/           # 浏览器环境工具（internal，不单独 semver 承诺）
│   ├── browser/                 # 浏览器 SDK 主入口
│   └── vue/                     # Vue 2/3 框架适配（Integration 模式）
│
├── apps/
│   ├── backend/
│   │   ├── dsn/                 # Ingest 服务
│   │   └── monitor/             # 业务 API + 聚合 + Source Map + 告警
│   └── frontend/
│       └── monitor/             # Web 监控控制台
│
├── examples/                    # 各框架接入示例（vanilla、vue-vite 等）
├── docker/                      # Compose、镜像与初始化脚本
├── docs/                        # 项目文档
└── awesome/                     # Sentry 参考代码（gitignore，仅本地阅读）
```

### 3.1 包依赖关系（SDK 侧）

```text
types  ◀── utils
  ▲
  │
core ◀── utils
  ▲
  │
browser-utils (internal)
  ▲
  │
browser ◀── core, browser-utils, types
  ▲
  │
vue ◀── browser, core
```

**约定**

- 应用方安装 **`@sentry-guardian/browser`**；Vue 项目额外安装 **`@sentry-guardian/vue`**。
- `browser-utils` 仅供 monorepo 内部使用，不对外文档化。
- `types` 可被 backend 通过 workspace 引用，保证协议一致。

---

## 4. Packages 模块说明

### 4.1 `packages/types`

跨 SDK、Backend、Frontend 的**协议层类型**，不包含运行时逻辑。

| 类别 | 示例 |
|------|------|
| Event | `ErrorEvent`、`TransactionEvent`、`Breadcrumb` |
| Issue | `Issue`、`IssueStatus`、`Fingerprint` |
| 传输 | `Envelope`、`EnvelopeItem`、`EnvelopeItemType` |
| 上下文 | `User`、`Request`、`SdkInfo`、`Release` |
| API DTO | 控制台查询、Source Map 上传的请求/响应类型 |

> 参考：Sentry 已将 `@sentry/types` 并入 `@sentry/core`；本仓库保留独立 `types` 包，便于 Backend 不依赖 SDK 运行时。

### 4.2 `packages/utils`

无环境依赖的工具函数，被 `core` 与 backend 共用。

- 堆栈帧解析辅助、指纹 hash（稳定排序后 sha256）
- 深度裁剪、`maxValueLength`、循环引用安全序列化
- URL / 路径脱敏、时间戳规范化

### 4.3 `packages/core`

SDK **内核**，定义采集 → 处理 → 上报的完整流水线。

| 模块 | 职责 |
|------|------|
| **Client** | 生命周期、`captureException` / `captureMessage`、flush |
| **Scope** | `user`、`tags`、`extra`、`breadcrumb` 上下文栈 |
| **Integration** | 插件接口：`setup(client)`，由 `init` 统一注册 |
| **Transport** | 抽象上报：`send(envelope)`，含 buffer、retry、rate-limit 响应处理 |
| **Envelope** | 多 item 批量编码（event、session、client_report） |
| **EventProcessor** | `beforeSend` 链、采样（`sampleRate`）、ignore 规则 |
| **Session** | 可选：会话起止、崩溃标记，用于「影响用户数」统计 |

**不包含**：`window` 监听、fetch 实现、框架 hook——这些在 `browser` / `vue`。

### 4.4 `packages/browser-utils`

浏览器环境探测与底层能力封装（对标 `@sentry-internal/browser-utils`）。

- 原生 `fetch` / `XHR` 实现缓存与降级
- `document.visibilityState`、在线状态
- 轻量 UA / 能力检测

### 4.5 `packages/browser`

面向浏览器应用的 **SDK 主入口**。

| 模块 | 职责 |
|------|------|
| **BrowserClient** | 继承 core Client，注入浏览器默认项 |
| **integrations/** | 内置插件（见下表） |
| **transports/fetch** | 基于 Fetch 的 Transport（`keepalive`、并发与 64KB 限制） |
| **stack-parsers** | 各浏览器堆栈格式解析 |

#### 内置 Integration（分期）

| Integration | 阶段 | 说明 |
|-------------|------|------|
| `globalHandlers` | P0 | `window.onerror`、`unhandledrejection` |
| `dedupe` | P0 | 短时相同异常去重 |
| `inboundFilters` | P0 | `ignoreErrors`、`denyUrls`、`allowUrls` |
| `breadcrumbs` | P0 | console、navigation、DOM click（基础） |
| `browserApiErrors` | P0 | 资源加载失败 |
| `linkedErrors` | P0 | Error.cause 链 |
| `httpContext` | P0 | 当前 URL、Referrer |
| `performance` | P1 | Web Vitals、Navigation Timing |
| `browserTracing` | P1 | 路由 / 慢 XHR（简化 span） |
| `clickAnalytics` | P2 | 细粒度点击路径（可选关闭，见 §9） |

### 4.6 `packages/vue`

Vue 框架适配，**不是**独立 SDK，通过 Integration 挂到 `browser`。

- Vue 3：`app.config.errorHandler`；Vue 2：`Vue.config.errorHandler`
- 可选：`vueRouterIntegration`（路由 breadcrumb）
- 可选：`piniaIntegration`（状态快照，P2）
- 必须在 `app.mount()` **之前** 调用 `Sentry.init()`

### 4.7 预留：`packages/react`（未实现）

Error Boundary + `reactIntegration`，目录规划保留，首期不实现。

---

## 5. Apps 模块说明

### 5.1 `apps/backend/dsn` — Ingest 网关

对标 Sentry Relay 的**轻量 ingest 层**，职责单一：

| 职责 | 说明 |
|------|------|
| 接收 Envelope | `POST /api/{projectId}/envelope/` |
| DSN 鉴权 | 校验 public key + project，拒绝非法/过期 Key |
| Payload 校验 | JSON schema、大小上限、必填字段 |
| 限流 | 按 project / IP；返回 `429` + `Retry-After` |
| 脱敏 | 服务端 scrubbing（cookie、authorization 等敏感字段） |
| 持久化 | 写入 Event 存储；投递聚合任务（队列或 DB 通知） |

**不做**：复杂查询、用户登录、Issue 列表、Source Map 符号化。

### 5.2 `apps/backend/monitor` — 业务与查询层

| 子模块 | 职责 |
|--------|------|
| **api** | 控制台 REST/GraphQL：Project、Issue、Event、Release |
| **grouper** | Issue 指纹计算与 upsert（异步 worker 或定时任务） |
| **symbolicator** | Source Map 上传、存储、堆栈反查（查询时符号化，MVP） |
| **alerter** | 规则引擎：新 Issue、错误率阈值 → Webhook / 邮件 |
| **auth** | 用户注册登录、组织/项目 RBAC（与 DSN Key **分离**） |

#### Issue 聚合流程

```text
Event 写入存储
    │
    ▼
Worker 读取未聚合 Event
    │
    ├─ 计算 fingerprint（堆栈帧 + 异常类型 + 可选 release）
    ├─ 查 PostgreSQL issues 表
    ├─ 命中 → 更新 last_seen、event_count、users_seen
    └─ 未命中 → 创建新 Issue
    │
    ▼
可选：触发 alerter
```

指纹算法 MVP：取 top N 帧（去掉 query 的 filename + function + lineno）稳定排序后 hash；后续可支持自定义 `fingerprint` 字段。

### 5.3 `apps/frontend/monitor` — 监控控制台

| 能力 | 阶段 |
|------|------|
| 登录 / 注册、项目管理 | P0 |
| Issue 列表、详情、堆栈展示 | P0 |
| Release 维度筛选 | P1 |
| 性能指标图表 | P1 |
| 静态资源瀑布流 | P1 |
| Source Map 上传与管理 UI | P1 |
| 用户路径 / 行为分析 | P2（可选模块，见 §9） |

**技术栈（规划）**：TypeScript + Vite + shadcn/ui + Tailwind CSS。  
（shadcn/ui 生态默认 Tailwind；若选用 WindiCSS 需额外适配，不推荐。）

---

## 6. 核心协议

### 6.1 DSN

```text
https://{publicKey}@{host}/api/{projectId}
```

- SDK `init({ dsn })` 解析出 host、projectId、publicKey。
- 上报 URL：`POST {origin}/api/{projectId}/envelope/`
- 请求头：`Content-Type: application/x-sentry-envelope`（或 `application/json` 简化版，MVP 可二选一后定稿）
- Secret key 仅用于服务端管理接口，**不出现在浏览器**。

### 6.2 Envelope（批量上报）

借鉴 Sentry Envelope，MVP 支持单 event item，后续扩展多 item。

```text
{metadata line JSON}\n
{item header JSON}\n
{item payload}\n
```

**Metadata 示例**

```json
{ "sdk": { "name": "sentry-guardian.javascript.browser", "version": "0.1.0" }, "sent_at": "2026-06-03T12:00:00.000Z" }
```

**Item 类型（规划）**

| type | 阶段 | 说明 |
|------|------|------|
| `event` | P0 | 错误 / 消息 |
| `session` | P1 | 会话统计 |
| `client_report` | P1 | SDK 丢弃/失败统计 |
| `attachment` | P2 | 截图等（可选） |

### 6.3 ErrorEvent 核心字段（MVP）

```typescript
interface ErrorEvent {
  event_id: string;
  timestamp: string;
  platform: 'javascript';
  level: 'error' | 'warning' | 'info';
  release?: string;
  environment?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: { frames: StackFrame[] };
    }>;
  };
  request?: { url: string; headers?: Record<string, string> };
  user?: { id?: string; email?: string; ip_address?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  breadcrumbs?: Breadcrumb[];
  sdk: { name: string; version: string };
}
```

完整定义以 `packages/types` 为准；变更需同步 CHANGELOG。

### 6.4 Transport 与限流

SDK Transport 需处理：

| 响应 | 行为 |
|------|------|
| `200` | 成功，清空 buffer 对应项 |
| `429` | 读 `Retry-After` / `X-Sentry-Rate-Limits`，退避重试 |
| 网络错误 | 有限次重试；可选持久化 offline queue（P2） |

Browser Transport 在页面卸载时使用 `fetch({ keepalive: true })`（注意 64KB 与并发上限）。

---

## 7. 存储模型（草案）

### 7.1 PostgreSQL（元数据，两档共用）

| 表 | 用途 |
|----|------|
| `organizations` / `users` | 控制台账号 |
| `projects` | 项目；存 DSN public key hash |
| `issues` | 聚合后 Issue：fingerprint、title、status、first/last_seen、count |
| `releases` | 版本号、关联 Source Map |
| `source_maps` | artifact 路径、release、文件名 |
| `alert_rules` | 告警规则 |

### 7.2 Event 明细

**Lite**：PostgreSQL `events` 表（JSONB payload + 索引 event_id、project_id、timestamp、issue_id）。

**Analytics**：ClickHouse 建议表划分：

| 表 | 引擎建议 | 用途 |
|----|----------|------|
| `events` | MergeTree，按天分区 | 原始 ErrorEvent |
| `transactions` | MergeTree | 性能 span（P1） |
| `sessions` | AggregatingMergeTree | 会话汇总（P1） |

TTL 与分区策略在实现阶段按留存天数（默认 30/90 天可配置）定稿。

---

## 8. 鉴权与安全

| 场景 | 机制 |
|------|------|
| SDK 上报 | Project DSN public key，仅 ingest 权限 |
| 控制台 API | Session / JWT，RBAC（组织管理员、项目成员） |
| Source Map 上传 | 用户 JWT + project 权限；CLI 可用 project token |

**隐私**

- SDK：`sendDefaultPii: false`（默认）；`beforeSend` 可裁剪
- 服务端：字段级 scrubbing（password、token、cookie）
- P2 点击/路径采集：默认关闭，需显式 `enableClickAnalytics: true`

---

## 9. 功能边界与 MVP

### 9.1 MVP 闭环（第一版发布目标）

```text
browser SDK 捕获 JS Error
  → dsn 校验并存储
  → monitor worker 聚合 Issue
  → frontend Issue 列表 + 堆栈详情
```

| 组件 | MVP 范围 |
|------|----------|
| `core` + `browser` | globalHandlers、dedupe、inboundFilters、fetch transport |
| `types` | ErrorEvent + Envelope + Issue |
| `backend/dsn` | 单 endpoint + DSN 鉴权 + 写库 |
| `backend/monitor` | fingerprint + Issue CRUD API |
| `frontend/monitor` | 登录 + Issue 列表/详情 |
| **暂缓** | vue 包、Source Map、性能、告警、ClickHouse profile |

### 9.2 与 overview 路线图对齐

| overview 阶段 | 架构落点 |
|---------------|----------|
| P0 前端错误 | browser integrations 表 P0 行 + dsn + grouper |
| P1 基础性能 | performance integration + CH/PG transactions 表 |
| P2 运营辅助 | alerter、session、Release 对比 |
| 不做/延后 | Session Replay、Native SDK、专业热力图/录屏 |

「用户路径 / 行为分析」列为 **P2 可选模块**（`clickAnalytics` integration + 独立 CH 表），与「非专业统计平台」定位一致：仅辅助排障，默认关闭。

---

## 10. 工程化

### 10.1 工具链（规划）

| 项 | 选型 |
|----|------|
| 包管理 | pnpm workspace |
| SDK 构建 | tsup / Rollup（ESM + CJS + IIFE bundle） |
| Backend | Node.js（Fastify/Hono）或 Go（待定） |
| Frontend | Vite + React 或 Vue（与 shadcn 选型一致，待定） |
| 测试 | Vitest（packages）、契约测试（dsn envelope） |
| 版本发布 | Changesets，包前缀 `@sentry-guardian/*` |

### 10.2 根目录待补充文件

- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.github/workflows/ci.yml`（lint、test、build）
- `docker/compose.yml`（Lite 默认栈）

### 10.3 测试策略

| 层级 | 要求 |
|------|------|
| packages | 单元测试：指纹、envelope 编解码、integration 行为 |
| backend/dsn | Envelope 契约测试、鉴权与限流 |
| backend/monitor | Issue 聚合 golden case |
| frontend | Issue 列表/详情 smoke E2E |

---

## 11. 待决事项（Open Questions）

实现前需拍板的决策：

| # | 议题 | 选项 |
|---|------|------|
| 1 | Backend 语言 | Node（与 SDK 同构） vs Go（ ingest 性能） |
| 2 | 控制台框架 | React + shadcn vs Vue 3 + shadcn-vue |
| 3 | MVP 存储 | 仅 Lite（PG）首发 vs 同时交付 Analytics profile |
| 4 | Envelope Content-Type | 完整 sentry-envelope vs 简化 JSON POST |
| 5 | 符号化时机 | 仅查询时 vs ingest 时预符号化 |
| 6 | 聚合触发 | 同步（dsn 内） vs 异步 worker（推荐） |

---

## 12. 相关文档

| 文档 | 说明 |
|------|------|
| [overview.md](./overview.md) | 产品定位、用户、路线图 |
| [README.md](./README.md) | 文档索引 |
| [../README.md](../README.md) | 仓库首页 |
| [ai-guide/open-source.md](./ai-guide/open-source.md) | 开源交付标准 |

---

## 附录 A：与 Sentry 模块对照

| SentryGuardian | Sentry 参考 | 差异 |
|----------------|-------------|------|
| `packages/core` | `@sentry/core` | 功能子集，无 Replay/Profiling |
| `packages/browser` | `@sentry/browser` | 集成数量按 P0/P1 裁剪 |
| `apps/backend/dsn` | Relay | 无 PII 配置下发集群，单机 ingest |
| `apps/backend/monitor` | API + issues + Snuba | 无 Snuba 层；Lite 版直查 PG |
| `apps/frontend/monitor` | Sentry UI | 仅前端监控视图，简化多租户 |

---

## 附录 B：目录结构（实现后目标态）

```text
packages/
├── types/src/
│   ├── event.ts
│   ├── issue.ts
│   ├── envelope.ts
│   └── index.ts
├── core/src/
│   ├── client.ts
│   ├── scope.ts
│   ├── integration.ts
│   ├── transports/
│   └── index.ts
├── browser/src/
│   ├── client.ts
│   ├── sdk.ts
│   ├── integrations/
│   ├── transports/fetch.ts
│   └── index.ts
└── vue/src/
    ├── integration.ts
    └── index.ts

apps/backend/dsn/src/
├── routes/envelope.ts
├── auth/dsn.ts
└── storage/

apps/backend/monitor/src/
├── api/
├── worker/grouper.ts
├── symbolicator/
└── alerter/

apps/frontend/monitor/src/
├── pages/issues/
├── pages/performance/
└── components/
```
