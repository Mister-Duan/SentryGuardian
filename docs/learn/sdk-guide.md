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

## 框架提示

| 框架 | 建议 |
|------|------|
| **Vite / SPA** | 在 `main.ts` 顶部 `init`；DSN 放 `VITE_*` 环境变量 |
| **SSR** | 仅在浏览器 bundle 中 `init`，避免 `window` 在服务端报错 |
| **Vue / React** | MVP 使用 browser 包即可；框架专用包（如 `vue`）尚未提供 |
| **微前端** | 子应用各自 `init` 时使用不同 Project DSN，或统一父应用 init |

仓库示例：`examples/vanilla`。

## 与 ingest 的协议

- Content-Type：`application/x-sentry-guardian-envelope`
- ingest 路径：`POST /api/sentry/{projectId}/envelope/`
- 成功：`201` + `{ stored: number }`

自定义 `transport` 时需保持兼容，见 `packages/browser/src/transports/fetch.ts`。

## 常见问题

| 问题 | 处理 |
|------|------|
| 本地 CORS | ingest 默认允许跨域；生产收紧 `CORS_ORIGIN` |
| DSN 里 host 端口 | 开发为 `localhost:3001`，与 monitor `3002` 不同 |
| Source Map | MVP 未做符号化；堆栈为打包后文件名 |
| 性能监控 | `tracesSampleRate` 等属 P1，当前未实现 |

完整选项表：[configuration.md](../configuration.md#sdk-sentry-guardianbrowser)。

## 下一步

- [console-guide.md](./console-guide.md) — 在控制台查看上报结果
- [data-flow.md](./data-flow.md) — 理解聚合延迟（约 3s）
