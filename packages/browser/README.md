# @sentry-guardian/browser

浏览器端 SDK：默认集成（全局错误、面包屑、URL 过滤等）、Fetch Transport、堆栈解析。

## 安装

```bash
pnpm add @sentry-guardian/browser
```

## 使用

```ts
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  // 本地 ingest 示例：http://localhost:3001/api/sentry/<projectId>
  dsn: 'https://your-ingest-host/api/sentry/<projectId>',
  environment: 'production',
});

// 手动上报
Sentry.captureException(new Error('something broke'));
```

## 默认集成（P0）

| 集成 | 说明 |
|------|------|
| `InboundFilters` | `denyUrls` / `allowUrls` |
| `Dedupe` | 短时重复异常去重（Client 内） |
| `GlobalHandlers` | `error` / `unhandledrejection` |
| `HttpContext` | 当前 URL、Referrer |
| `LinkedErrors` | `Error.cause` 链 |
| `Breadcrumbs` | console、导航、点击 |
| `BrowserApiErrors` | script/img/link 加载失败 |

关闭默认集成：`defaultIntegrations: false`，再传入自定义 `integrations`。

## 文档

- [SDK 使用指南](../../docs/learn/sdk-guide.md)
- [配置参考](../../docs/configuration.md#sdk-sentry-guardianbrowser)

## 相关包

- [@sentry-guardian/core](../core/README.md) — 内核
- [docs/packages.md](../../docs/packages.md) — 实现状态
