# @sentry-guardian/types

SentryGuardian 跨端协议类型（SDK、Backend、Frontend 共用）。仅含类型定义，无运行时逻辑。

## 安装

```bash
pnpm add @sentry-guardian/types
```

Monorepo 内：

```json
{
  "dependencies": {
    "@sentry-guardian/types": "workspace:*"
  }
}
```

## 导出模块

| 模块 | 说明 |
|------|------|
| `event` | `ErrorEvent`、`ExceptionValue`、`User` 等 |
| `envelope` | `Envelope`、`EnvelopeItem`、`EnvelopeItemType` |
| `issue` | `Issue`、`IssueStatus` |
| `api` | 控制台 REST DTO |
| `stack` / `breadcrumb` | 堆栈帧与面包屑 |

## 构建

```bash
pnpm --filter @sentry-guardian/types build
```

协议变更须同步 [CHANGELOG.md](../../CHANGELOG.md) 与 [docs/architecture.md](../../docs/architecture.md)。

公开类型须 **中英文双语** JSDoc；接口建议含典型数据 `@example`，函数须含 Input/Output 示例，见 [doc-comments.md](../../docs/ai-guide/doc-comments.md)。
