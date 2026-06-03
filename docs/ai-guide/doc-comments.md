# 代码文档注释规范（中英文）

本仓库**公开 API** 与**协议类型**的文档注释（JSDoc / TSDoc）须同时包含**英文**与**简体中文**，便于开源协作与国内团队阅读。

## 适用范围

| 须双语 | 可不双语 |
|--------|----------|
| `packages/*` 对外导出（`export`）的类型、函数、类、常量 | 仅 `export` 的 `index.ts` 再导出（注释留在定义处） |
| `apps/*` 对外 REST DTO、公开 Service 方法 | 私有函数、实现细节、测试用 helper |
| 配置项、环境变量说明（代码内 JSDoc） | 行内「为什么」注释（仍建议双语，见下） |

**用户可见 Markdown 文档**（`README`、`docs/`）以中文为主，可附英文摘要；与本节「代码内文档注释」分工不同。

## 格式（强制）

**块注释**：先英文一行，再中文一行，语义一致、简洁对等。

```typescript
/**
 * Stack frame in an exception stacktrace.
 * 异常堆栈中的栈帧。
 */
export interface StackFrame {
  /** Source file path. 源文件路径。 */
  filename?: string;
}
```

**单行**（仅用于极短说明）：

```typescript
/** Event severity level. 事件严重级别。 */
export type EventLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';
```

### 禁止

- 仅英文或仅中文（公开 API）
- 中英文描述矛盾或无关
- 用机器翻译堆砌、重复第三语言

### 字段注释

- 公开接口的**非显而易见**字段应写双语 `@` 或 `/** */`
- 自解释字段（如 `email: string`）可只在类型上写块注释，不必每个字段都写

## 语言分工（与 project-core 一致）

| 内容 | 语言 |
|------|------|
| 文档注释（JSDoc/TSDoc） | 英文 + 简体中文 |
| 标识符、类型名、文件名 | 英文 |
| Commit message、CHANGELOG | 英文 |
| `docs/` 用户文档 | 简体中文为主 |

## AI 协作要求

1. 新增或修改**公开导出**时，同步补全/更新双语文档注释。
2. 审查 diff 时检查：是否仅有单语、是否遗漏导出符号。
3. 不要求为消 diff 而给私有实现补冗长注释；**公开 API 不可缺**。

## 示例包

参考 [@sentry-guardian/types](../../packages/types/src/) 各模块。

## 相关文档

- [open-source.md](./open-source.md) — SDK 与公开 API
- [AGENTS.md](../../AGENTS.md) — AI 入口
- [.cursor/rules/project-core.mdc](../../.cursor/rules/project-core.mdc) — 全局语言规则
