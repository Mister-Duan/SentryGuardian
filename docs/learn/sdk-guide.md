# SDK 使用指南（浏览器）

面向在 **Web 应用** 中接入 `@sentry-guardian/browser` 的开发者。

## 安装

Monorepo 内（本仓库示例）：

```json
{
  "dependencies": {
    "@sentry-guardian/browser": "workspace:*"
  }
}
```

发布后：

```bash
pnpm add @sentry-guardian/browser
```

## 最小接入

在应用入口**最早**执行 `init`（路由、框架 mount 之前）：

```typescript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // 从环境变量读取，勿写死到公开仓库
  environment: import.meta.env.MODE,
});
```

DSN 从自托管实例获取：

- 跑过 `db:seed` 后的终端输出，或
- 控制台登录 → 项目列表中的 DSN 字段

## 手动上报

```typescript
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}

Sentry.captureMessage('配置已加载', 'info');
```

页面关闭前尽量 flush（SPA 可选）：

```typescript
window.addEventListener('pagehide', () => {
  void Sentry.flush(2000);
});
```

## 默认集成

`defaultIntegrations: true`（默认）时自动启用：

| 集成 | 你会得到什么 |
|------|----------------|
| **GlobalHandlers** | 未 try/catch 的错误、未处理的 Promise 拒绝 |
| **BrowserApiErrors** | `<script>` / `<img>` / `<link>` 加载失败 |
| **Breadcrumbs** | 之后的错误附带 console、跳转、点击记录 |
| **HttpContext** | 当前页 URL、Referrer |
| **LinkedErrors** | `new Error('wrap', { cause })` 链完整上报 |
| **InboundFilters** | 配合 `denyUrls` / `allowUrls` |
| **Dedupe** | 2 秒内相同异常不重复发送 |

### 关闭默认集成

仅保留手动上报：

```typescript
Sentry.init({
  dsn: '...',
  defaultIntegrations: false,
});
```

### 过滤浏览器扩展噪音

```typescript
Sentry.init({
  dsn: '...',
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
});
```

### 只监控本站

```typescript
Sentry.init({
  dsn: '...',
  allowUrls: [/^https:\/\/app\.example\.com/],
});
```

## beforeSend：最后一道过滤

```typescript
Sentry.init({
  dsn: '...',
  beforeSend(event) {
  // 丢弃特定消息
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
  // 脱敏自定义字段
    if (event.extra?.orderId) {
      event.extra.orderId = '[Redacted]';
    }
    return event;
  },
});
```

返回 `null` 表示丢弃，不会进入 ingest。

## 用户与标签（Scope）

MVP 可通过 `getClient()` 访问 Scope（若需更丰富 API，后续版本可能导出便捷方法）：

```typescript
const client = Sentry.getClient();
client?.getScope().get().setUser({ id: '42' });
client?.getScope().get().setTag('tenant', 'acme');
client?.getScope().get().setExtra('featureFlags', { beta: true });
```

`sendDefaultPii: false`（默认）时，仅 `user.id` 会随事件上报。

## 采样

```typescript
Sentry.init({
  dsn: '...',
  sampleRate: 0.25, // 约 25% 错误会上报
});
```

采样在客户端随机决定，未上报的事件不会出现在控制台。

## Vue 3（`@sentry-guardian/vue`）

```typescript
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import {
  init,
  vueIntegration,
  vueRouterIntegration,
} from '@sentry-guardian/vue';

const router = createRouter({ history: createWebHistory(), routes: [] });

init({
  dsn: import.meta.env.VITE_DSN,
  environment: import.meta.env.MODE,
  release: 'my-vue-app@1.0.0',
  integrations: [vueRouterIntegration(router)],
});

const app = createApp(App);
vueIntegration(app); // 捕获组件渲染错误
app.use(router).mount('#app');
```

- `vueIntegration` 须在 `mount` 之前调用
- `vueRouterIntegration` 将路由变化记为 breadcrumb

示例：`examples/vue-vite`。

> **React**：无 `packages/react`；在 Error Boundary 中调用 `captureException` 即可，或仅用 browser 默认集成。

## 性能监控

启用 Web Vitals 与路由追踪（事务事件，非完整 APM）：

性能集成在**子路径**按需导入，主包 `@sentry-guardian/browser` 不含 perfume.js，减小仅错误监控场景的 bundle 体积：

```typescript
import { init } from '@sentry-guardian/browser';
import { performanceIntegration } from '@sentry-guardian/browser/performance';
import { browserTracingIntegration } from '@sentry-guardian/browser/tracing';

init({
  dsn: '...',
  release: 'my-app@1.2.0',
  integrations: [
    performanceIntegration(),
    browserTracingIntegration({ slowThresholdMs: 3000 }),
  ],
});
```

| 集成 | 上报内容 |
|------|----------|
| `performanceIntegration` | [perfume.js](https://github.com/Zizzamia/perfume.js) 全量字段指标（见下） |
| `browserTracingIntegration` | 慢 fetch（`http.client`） |

**与错误 `denyUrls` 的区别**：`init({ denyUrls })` 仅作用于错误事件的 `request.url`；性能集成有独立的 `denyUrls` / `ignoreIngest`，默认会排除 SDK ingest URL（`parseDsn(dsn).envelopeUrl` 与 `tunnel` 实际 POST 地址），避免上报请求污染 Resource Timing 与慢 fetch 事务。

`performanceIntegration` 内部调用 `initPerfume`，默认开启 Resource Timing 与 Element Timing。

**默认 LCP 行为**：SDK 注入 `reportOptions.lcp.reportAllChanges: true`，LCP 每次更新即可上报（不必等到切 Tab）；可通过 `reportOptions: { lcp: { reportAllChanges: false } }` 覆盖。

**批量上报**：多条 perfume 事务合并为单个 envelope（`Client.captureTransactions`），降低 POST 频率；`resource.timing` 等高频指标约 400ms 批量。页面 `hidden` / `pagehide` 时 SDK 尽力通过 `sendBeacon` 同步 flush。

**采集建议**：查看 Web Vitals 时加载后停留数秒，用**切 Tab**结束会话，避免连续刷新导致 idle 队列中的指标丢失。

```typescript
performanceIntegration({
  resourceTiming: true,   // 默认 true
  elementTiming: true,    // 默认 true
  maxMeasureTime: 30000,
  denyUrls: [/analytics\.example\.com/], // 可选：额外排除
  ignoreIngest: true,     // 默认 true，自动排除 ingest
  reportOptions: {
    lcp: { reportAllChanges: true }, // SDK 默认；可设为 false
  },
  steps: { /* 可选：用户旅程 */ },
});

browserTracingIntegration({
  slowThresholdMs: 3000,
  denyUrls: [/health/],
  ignoreIngest: true,
});
```

SPA 路由可配合 perfume 辅助 API（从性能子路径导出）：

```typescript
import { markNTBT, trackUJNavigation } from '@sentry-guardian/browser/performance';

router.listen(() => {
  markNTBT();
  trackUJNavigation();
});
```

事务字段：`metric`、`metric_value`、`metric_rating`、`navigation_type`、`perf_context`（设备与归因）。

**指标含义（perfume `metricName` 全表、时间段说明、控制台筛选）** → [performance-metrics.md](./performance-metrics.md)

架构说明（AI / 维护）→ [performance-design.md](../ai-guide/performance-design.md)

控制台 **性能** 页查看事务列表与 Vital P75 概览。API：`GET /api/projects/:id/transactions?metric=LCP`。

## Source Map 与 Release

生产环境压缩代码需配合 Source Map 才能在控制台看到原始文件路径与源码上下文。

**完整入门与使用**（5 分钟本地验证、Vite 插件、CLI、控制台、CI、故障排查）→ **[source-map-guide.md](./source-map-guide.md)**

### 快速摘要

1. SDK `init({ release: 'my-app@1.0.0' })` — 版本须与上传一致
2. 构建 `sourcemap: true`，上传 `dist/**/*.map` 到 Monitor Release
3. Issue 详情点击 **In App** 栈帧查看源码

**Vite 插件（推荐）**

```ts
import { sentryGuardianVitePlugin } from '@sentry-guardian/vite-plugin';

export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    sentryGuardianVitePlugin({
      projectId: process.env.SG_PROJECT_ID!,
      release: 'my-app@1.0.0',
      authToken: process.env.SG_TOKEN!,
      dryRun: !process.env.SG_TOKEN,
    }),
  ],
});
```

**CLI 脚本**

```bash
node scripts/upload-sourcemaps.mjs \
  --project-id <id> --token <jwt> \
  --release my-app@1.0.0 --dir ./dist \
  --url-prefix https://cdn.example.com/assets
```

也可在控制台 **Releases** 页手动上传；详见 [source-map-guide.md](./source-map-guide.md)。

## Tunnel（绕过广告拦截）

若 ingest 域名被拦截，可在**同源**后端增加转发端点，SDK 使用 `tunnel`：

```typescript
Sentry.init({
  dsn: 'https://ingest.example.com/api/sentry/envelope/<projectId>',
  tunnel: '/api/sentry-tunnel', // 你的应用同源代理
});
```

上报请求发往 `tunnel` URL，由你的服务端转发至真实 ingest（需自行实现代理）。

## 框架提示

| 框架 | 建议 |
|------|------|
| **Vite / SPA** | 在 `main.ts` 顶部 `init`；DSN 放 `VITE_*` 环境变量 |
| **SSR** | 仅在浏览器 bundle 中 `init`，避免 `window` 在服务端报错 |
| **Vue 3** | 使用 `@sentry-guardian/vue` |
| **React** | 使用 `@sentry-guardian/browser` + Error Boundary |
| **微前端** | 子应用各自 `init` 时使用不同 Project DSN，或统一父应用 init |

仓库示例：`examples/vanilla`、`examples/vue-vite`。

## 与 ingest 的协议

- Content-Type：`application/x-sentry-guardian-envelope`
- ingest 路径：`POST /api/sentry/envelope/{projectId}/`
- 成功：`201` + `{ stored: number }`

自定义 `transport` 时需保持兼容，见 `packages/browser/src/transports/fetch.ts`。

## 常见问题

| 问题 | 处理 |
|------|------|
| 本地 CORS | ingest 默认允许跨域；生产收紧 `CORS_ORIGIN` |
| DSN 里 host 端口 | 开发为 `localhost:3001`，与 monitor `3002` 不同 |
| Source Map 未符号化 | 确认 `release` 一致且已上传 `.map` | [source-map-guide.md](./source-map-guide.md) |
| 性能页无数据 | 检查是否从 `/performance`、`/tracing` 子路径加入 `performanceIntegration` / `browserTracingIntegration` |
| ingest 429 | 项目默认 100 次/分钟限流；流量尖峰时 SDK 会按 `Retry-After` 退避 |

完整选项表：[configuration.md](../configuration.md#sdk-sentry-guardianbrowser)。

## 下一步

- [console-guide.md](./console-guide.md) — 在控制台查看上报结果
- [source-map-guide.md](./source-map-guide.md) — Source Map 完整指南
- [data-flow.md](./data-flow.md) — 理解聚合延迟（约 3s）
