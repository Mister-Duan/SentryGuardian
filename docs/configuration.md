# 配置参考

本文汇总 SentryGuardian **环境变量**、**SDK 初始化选项**、**端口与 URL** 约定。实现以代码为准；变更请同步 [CHANGELOG.md](../CHANGELOG.md)。

## 配置文件一览

| 文件 | 用途 |
|------|------|
| [.env.example](../.env.example) | 根目录环境变量模板（复制为 `.env`） |
| `docker/compose.yml` | 本地 PostgreSQL；或全栈（postgres + migrate + dsn + monitor + frontend） |
| `apps/frontend/monitor/.env`（可选） | 前端 `VITE_*`（也可用根 `.env` + Vite 加载） |
| `examples/vanilla/.env`（可选） | 示例页 `VITE_DSN` |

> `.env` 不要提交到 Git。生产密钥使用部署平台的 Secret 管理。

---

## 环境变量

### 数据库（必填，后端）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | 是 | — | PostgreSQL 连接串，如 `postgresql://user:pass@host:5432/dbname` |

Prisma 与两个 Nest 应用共用此变量。

### 种子脚本 `db:seed`

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `SEED_ADMIN_EMAIL` | 否 | `admin@localhost` | 默认管理员邮箱 |
| `SEED_ADMIN_PASSWORD` | 否 | `adminadmin` | 默认管理员密码（bcrypt 入库） |
| `SEED_INGEST_HOST` | 否 | `localhost:3001` | 写入 DSN 的 ingest 主机（`host:port`，无协议） |

### backend/dsn（ingest，默认端口 3001）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DSN_PORT` | 否 | `3001` | HTTP 监听端口 |
| `CORS_ORIGIN` | 否 | `true`（允许全部） | CORS 来源；生产建议设为前端域名 |
| `MAX_ENVELOPE_BYTES` | 否 | `1048576`（1MB） | 单条 Envelope 请求体上限 |

ingest 鉴权：`EnvelopeService.ingest` 校验 URL 中 `{projectId}` 存在于 `projects` 表，否则 `401`。

ingest 限流：按项目 `rate_limit_per_minute`（默认 **100**/分钟，存于 DB）；超限返回 `429` + `Retry-After: 60`。

### backend/monitor（API + Grouper + 告警 + 维护，默认端口 3002）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `MONITOR_PORT` | 否 | `3002` | HTTP 监听端口 |
| `JWT_SECRET` | 生产必填 | `dev-secret-change-me` | JWT 签名密钥；**生产必须更换** |
| `CORS_ORIGIN` | 否 | `true` | 控制台跨域来源 |
| `GROUPER_POLL_MS` | 否 | `3000` | 未聚合 Event 轮询间隔（毫秒） |
| `EVENT_RETENTION_DAYS` | 否 | `30` | 超过该天数的 `events` 行由维护任务删除 |
| `SEED_INGEST_HOST` | 否 | `localhost:3001` | API 返回 DSN 时使用的 ingest 主机 |
| `SMTP_HOST` | 否 | — | 配置后告警可尝试邮件（当前为日志桩） |
| `SMTP_PORT` | 否 | `587` | SMTP 端口 |

### frontend/monitor（Vite）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `VITE_API_URL` | 否 | `''`（空） | Monitor API 根地址。空则使用同源或 Vite 代理 `/api` → `:3002` |

生产构建示例：

```bash
VITE_API_URL=https://monitor.example.com pnpm --filter @sentry-guardian/frontend-monitor build
```

### examples/vanilla

| 变量 | 必填 | 说明 |
|------|------|------|
| `VITE_DSN` | 是（运行示例时） | 完整 DSN 字符串，来自 `db:seed` 输出 |

---

## DSN 格式

```text
{scheme}://{host}[:port]/api/sentry/{projectId}
```

| 部分 | 说明 |
|------|------|
| `scheme` | `http` 或 `https`；见下表「协议约定」 |
| `host` | ingest 服务地址，如 `localhost:3001` 或 `ingest.example.com`（**不要**带路径） |
| `projectId` | 项目 ID（cuid），非 slug |

示例：`http://localhost:3001/api/sentry/clxxxxxxxx`

### 协议约定（本地 vs 生产）

| 场景 | DSN / 上报 URL | 说明 |
|------|----------------|------|
| 本地开发（`localhost`、`127.0.0.1`、`::1`） | `http://localhost:3001/api/sentry/...` | ingest 默认仅 HTTP；`db:seed` 的 `buildDsn` 生成 `http://` |
| 生产（自定义域名） | `https://ingest.example.com/api/sentry/...` | 前置 TLS 终结；`buildDsn` 对非回环主机使用 `https://` |
| DSN 误写 `https://...@localhost` | SDK 仍上报 **`http://localhost:.../envelope/`** | `parseDsn` 对回环主机强制 HTTP |

SDK 实际上报（`parseDsn` 解析后的 `envelopeUrl`）：

```text
POST {scheme}://{host}/api/sentry/{projectId}/envelope/
Content-Type: application/x-sentry-guardian-envelope
```

ingest 通过 URL 中的 `projectId` 识别项目；`projects.public_key` 仍保留于数据库供后续轮换等能力，**不再**写入 DSN。

实现：`packages/core/src/dsn.ts`（`parseDsn`、`ingestScheme`）、`apps/backend/libs/database/src/dsn.ts`（`buildDsn`）。

---

## 端口与 URL 对照（本地默认）

| 服务 | 端口 | 典型 URL |
|------|------|----------|
| PostgreSQL | 5432 | `postgresql://sentryguardian:sentryguardian@localhost:5432/sentryguardian` |
| dsn | 3001 | `http://localhost:3001` |
| monitor | 3002 | `http://localhost:3002/api` |
| 控制台 | 5173 | `http://localhost:5173` |
| vanilla 示例 | 5174 | `http://localhost:5174` |
| vue-vite 示例 | 5175 | `http://localhost:5175`（若本地启动） |

### 脚本 `upload-sourcemaps.mjs`

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `MONITOR_API_URL` | 否 | `http://localhost:3002` | monitor API 根地址 |

CLI 参数：`--project-id`、`--token`（JWT）、`--release`、`--dir`（默认 `./dist`）。

---

## SDK：`@sentry-guardian/browser`

通过 `Sentry.init(options)` 配置。类型定义：`packages/browser/src/sdk.ts`、`packages/browser/src/client.ts`。

### 必填

| 选项 | 类型 | 说明 |
|------|------|------|
| `dsn` | `string` | ingest DSN，见上文 |

### 常用选项（继承 core）

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `environment` | `string` | `'production'` | 环境标签，便于控制台筛选 |
| `release` | `string` | — | 版本号；与 Release / Source Map 符号化关联 |
| `sampleRate` | `number` | `1` | 错误采样率 `0`～`1` |
| `sendDefaultPii` | `false` | `boolean` | 为 `true` 时上报完整 `user`；否则仅 `user.id` |
| `maxBreadcrumbs` | `number` | `100` | 单事件附带的面包屑上限 |
| `ignoreErrors` | `(string \| RegExp)[]` | `[]` | 消息匹配则丢弃（子串或正则） |
| `beforeSend` | `function` | — | 发送前钩子，返回 `null` 丢弃事件 |
| `linkedErrors` | `boolean` | `true` | 是否展开 `Error.cause` 链 |

### 浏览器专用

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `denyUrls` | `(string \| RegExp)[]` | `[]` | `request.url` 命中则丢弃 |
| `allowUrls` | `(string \| RegExp)[]` | `[]` | 非空时仅保留 URL 匹配的事件 |
| `defaultIntegrations` | `boolean` | `true` | 为 `false` 时不加载 P0 默认集成 |
| `integrations` | `Integration[]` | `[]` | 额外集成（按 `name` 与默认去重） |
| `transport` | `Transport` | 内置 Fetch+Buffer | 自定义上报实现 |
| `tunnel` | `string` | — | 同源代理 URL；上报发往 tunnel 而非 DSN 的 `envelopeUrl`（绕过广告拦截） |

### 可选性能集成（手动加入 `integrations`）

| 集成 | 导入 | 作用 |
|------|------|------|
| `Performance` | `performanceIntegration` | LCP、CLS、TTFB → `TRANSACTION` 事件 |
| `BrowserTracing` | `browserTracingIntegration` | 路由导航、慢 fetch（可设 `slowThresholdMs`） |

```typescript
import {
  init,
  performanceIntegration,
  browserTracingIntegration,
} from '@sentry-guardian/browser';

init({
  dsn: '...',
  release: 'my-app@1.2.0',
  integrations: [performanceIntegration(), browserTracingIntegration()],
});
```

事务在控制台 **性能** 页与 `GET /api/projects/:id/transactions` 查看。

### 默认集成（`defaultIntegrations: true`）

| 集成名 | 作用 |
|--------|------|
| `InboundFilters` | `denyUrls` / `allowUrls` |
| `Dedupe` | 2 秒内相同异常只上报一次 |
| `GlobalHandlers` | `window.onerror`、`unhandledrejection` |
| `HttpContext` | 附加当前页 URL、Referrer |
| `LinkedErrors` | 标记；实际 cause 链在 `BrowserClient` 处理 |
| `Breadcrumbs` | console / 导航 / 点击 |
| `BrowserApiErrors` | script、img、link 加载失败 |

### 初始化示例

```typescript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'http://localhost:3001/api/sentry/<projectId>',
  environment: import.meta.env.MODE,
  release: 'my-app@1.2.0',
  sampleRate: 1,
  denyUrls: [/chrome-extension:\/\//, /moz-extension:\/\//],
  beforeSend(event) {
    if (event.message?.includes('ignore')) return null;
    return event;
  },
});
```

### 运行时 API

| API | 说明 |
|-----|------|
| `captureException(error)` | 手动上报异常 |
| `captureMessage(msg, level?)` | 上报消息 |
| `flush(timeout?)` | 等待发送队列清空 |
| `close(timeout?)` | 关闭并 flush |
| `getClient()` | 获取当前 `BrowserClient` |
| `captureTransaction(ctx)` | 手动上报性能事务（integration 内部使用） |

---

## SDK：`@sentry-guardian/vue`

Vue 3 适配包，re-export `init` / `getClient`，并提供：

| API | 说明 |
|-----|------|
| `vueIntegration(app)` | 挂接 `app.config.errorHandler` |
| `vueRouterIntegration(router)` | 路由切换写入 breadcrumb |

须在 `app.mount()` **之前** `init`。示例见 `examples/vue-vite`、`packages/vue/README.md`。

```typescript
import { createApp } from 'vue';
import { init, vueIntegration, vueRouterIntegration } from '@sentry-guardian/vue';

init({
  dsn: import.meta.env.VITE_DSN,
  release: 'my-vue-app@1.0.0',
  integrations: [vueRouterIntegration(router)],
});

const app = createApp(App);
vueIntegration(app);
app.use(router).mount('#app');
```

> **`packages/react`** 按项目决策不实现；React 应用可直接使用 `@sentry-guardian/browser`。

---

## SDK：`@sentry-guardian/core`（高级 / 非浏览器）

用于自定义运行时或测试；浏览器应用请优先使用 `@sentry-guardian/browser`。

| 选项 | 说明 |
|------|------|
| `sdk` | **必填** `{ name, version }`，写入事件 `sdk` 字段 |
| 其余 | 与上表 `ClientOptions` 相同 |

`init` 见 `packages/core/src/sdk.ts`（无内置 Fetch，需自配 `transport`）。

---

## 控制台 REST API（monitor）

全局前缀：`/api`。除 **登录**、**setup** 外均需 `Authorization: Bearer <token>`。

### 认证与引导

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/login` | Body: `{ email, password }` → JWT |
| `GET` | `/api/setup/status` | `{ configured: boolean }` |
| `POST` | `/api/setup` | 首次引导 Body: `SetupRequest` → DSN |
| `GET` | `/api/health` | 健康检查 |

### 项目

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 项目列表（含 DSN） |
| `POST` | `/api/projects` | 创建项目 |
| `POST` | `/api/projects/:id/rotate-key` | 轮换 public key，返回新 DSN |

### Issue 与事件

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/issues` | Query: `project_id`, `status`, `search`, `environment`, `release`, `page`, `page_size` |
| `GET` | `/api/issues/:id` | Issue 详情 + 符号化后的 `latest_event` |
| `PATCH` | `/api/issues/:id` | Body: `{ status }` |
| `GET` | `/api/issues/:id/events` | 事件历史分页 |
| `GET` | `/api/events/:id` | 单事件详情 |
| `GET` | `/api/issues/:issueId/comments` | 评论列表 |
| `POST` | `/api/issues/:issueId/comments` | Body: `{ body }` |

### Release 与统计

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:projectId/releases` | Release 列表 |
| `POST` | `/api/projects/:projectId/releases` | Body: `{ version }` |
| `POST` | `/api/projects/:projectId/releases/:releaseId/artifacts` | multipart 字段 `file`（`.map`） |
| `GET` | `/api/projects/:projectId/trends` | Query: `hours`（默认 24） |
| `GET` | `/api/projects/:projectId/releases/compare` | 各 Release 错误数对比 |
| `GET` | `/api/projects/:projectId/transactions` | 性能事务分页 |

### 告警

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:projectId/alerts` | 规则列表 |
| `POST` | `/api/projects/:projectId/alerts` | 创建规则 |
| `PATCH` | `/api/projects/:projectId/alerts/:id` | 更新规则 |
| `DELETE` | `/api/projects/:projectId/alerts/:id` | 删除规则 |

类型定义：`packages/types/src/api.ts`、`event-api.ts`、`performance.ts`。

---

## 生产配置检查清单

- [ ] 更换 `JWT_SECRET` 为强随机串
- [ ] `DATABASE_URL` 使用托管 PostgreSQL + TLS
- [ ] `CORS_ORIGIN` 设为控制台实际域名（勿用 `*`）
- [ ] ingest 走 HTTPS；DSN 使用 `https://`
- [ ] 修改默认管理员密码或禁用 seed 账号
- [ ] 配置 `VITE_API_URL` 指向 monitor 公网地址
- [ ] 按需调大 `MAX_ENVELOPE_BYTES` 与数据库连接池
- [ ] 设置 `EVENT_RETENTION_DAYS` 与磁盘容量匹配
- [ ] 配置告警 Webhook；需要邮件时设置 `SMTP_*`
- [ ] CI 中 `upload-sourcemaps.mjs` 上传 Source Map 并设置 SDK `release`

更多部署说明：[learn/self-hosting.md](./learn/self-hosting.md)。
