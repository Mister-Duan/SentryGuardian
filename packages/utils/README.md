# @sentry-guardian/utils

SentryGuardian 共享工具函数（指纹、序列化、脱敏、时间处理），供 SDK 与 Backend 使用。

## 安装

```bash
pnpm add @sentry-guardian/utils
```

Monorepo 内：

```json
{
  "dependencies": {
    "@sentry-guardian/utils": "workspace:*",
    "@sentry-guardian/types": "workspace:*"
  }
}
```

## 模块

| 导出 | 说明 |
|------|------|
| `normalizeTimestamp` / `truncate` | 时间与字符串处理 |
| `safeSerialize` | 安全 JSON 序列化（深度、循环引用） |
| `computeFingerprint` | Issue 堆栈指纹（SHA-256，见 architecture §5.2） |
| `scrubUrl` / `scrubObject` | URL 与对象脱敏 |

> `computeFingerprint` 使用 Node.js `crypto`；主要用于 **backend grouper**。浏览器 SDK 若仅需序列化/脱敏，可按需 tree-shake 导入。

## 构建与测试

```bash
pnpm --filter @sentry-guardian/utils build
pnpm --filter @sentry-guardian/utils test
```

公开函数须 **中英文双语** JSDoc，且包含 **Input/Output `@example`**，见 [docs/ai-guide/doc-comments.md](../../docs/ai-guide/doc-comments.md)。
