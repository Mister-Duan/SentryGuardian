# @sentry-guardian/core

SentryGuardian SDK **内核**：采集 → 处理 → Envelope 编码 → Transport 上报。无 DOM / 无 Node 专有 API，供 `browser` 等环境包扩展。

## 模块

| 模块 | 说明 |
|------|------|
| `Client` | `captureException` / `captureMessage` / `flush` / `close` |
| `Scope` / `ScopeStack` | 用户、标签、面包屑上下文 |
| `Integration` | 插件接口 |
| `EventProcessor` | `beforeSend` 链 |
| `envelope` | `createEnvelope` / `serializeEnvelope` / `parseEnvelope` |
| `BufferTransport` | 缓冲 + 429 退避 |
| `dedupeIntegration` | 占位；去重在 `Client` 内实现 |

## 构建与测试

```bash
pnpm --filter @sentry-guardian/core build
pnpm --filter @sentry-guardian/core test
```

公开 API 须中英文双语 JSDoc，函数含 Input/Output `@example`，见 [doc-comments.md](../../docs/ai-guide/doc-comments.md)。

## 依赖

- [@sentry-guardian/types](../types/README.md)
- [@sentry-guardian/utils](../utils/README.md)

## 使用示例（Node / 测试）

```typescript
import { init, captureException } from '@sentry-guardian/core';

const client = init({
  dsn: 'https://publicKey@localhost/api/demo',
  sdkName: 'sentry-guardian.javascript',
  sdkVersion: '0.1.0',
});

captureException(new Error('test'));
await client.flush();
```

默认 Transport 为带缓冲的 `MockTransport`；真实 `fetch` 上报由规划中的 `browser` 包提供。

## 相关文档

- [packages.md](../../docs/packages.md)
- [development.md](../../docs/development.md)
