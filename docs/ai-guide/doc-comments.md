# 代码文档注释规范（中英文 + 用途 + 输入/输出示例）

本仓库**公开 API** 的文档注释（JSDoc / TSDoc）须：

1. 写清**用途 / 作用**（这条 API 解决什么问题、在链路中的职责）；
2. 同时包含**英文**与**简体中文**说明；
3. **导出函数**须包含**输入示例**与**输出示例**（`@example`）；
4. **导出类型 / 接口 / 枚举 / 类字段**须为**每个字段**写清用途（双语）；类型建议有典型 `@example` 对象。

> **调整已有函数或字段时**：与新增同等要求——改签名、改字段名、改语义时，**必须同步更新**对应用途说明与 Input/Output（或字段）示例，不得只改实现不改正文。

## 适用范围

| 须遵守 | 可不遵守 |
|--------|----------|
| `packages/*` 对外导出的函数、类方法 | 私有函数、测试 helper |
| `packages/*` 对外导出的类型、接口**及其每个字段** | 纯 re-export 的 `index.ts` |
| `apps/*` 对外 Service / Controller 公开方法 | 内部实现细节 |
| Prisma schema 模型字段（`///` 注释） | 迁移 SQL 生成文件 |

**用户可见 Markdown**（`README`、`docs/`）以中文为主；与代码内 JSDoc 分工不同。

## 格式（强制）

### 双语说明

块注释：**先英文一行，再中文一行**。

```typescript
/**
 * Truncate string to max length with ellipsis.
 * 将字符串截断到最大长度并追加省略号。
 */
```

### 函数：输入/输出示例（强制）

使用 `@example`，在代码块内用注释标出 **Input / 输入** 与 **Output / 输出**（各一行调用或字面量即可）。

```typescript
/**
 * Truncate string to max length with ellipsis.
 * 将字符串截断到最大长度并追加省略号。
 *
 * @example
 * ```ts
 * // Input / 输入
 * truncate('hello world', 8)
 * // Output / 输出
 * 'hello...'
 * ```
 */
export function truncate(value: string, maxLength: number): string;
```

**要求**

| 项 | 说明 |
|----|------|
| 必须有 `@example` | 每个 `export function` / 公开方法至少 1 个 |
| 必须标 Input / Output | 中英标签各写一次（见上） |
| 示例可运行 | 与实现一致；输出为真实返回值或字面量 |
| 多参数 | Input 写完整调用；Output 写返回值 |
| 无返回值 | Output 写 `undefined` 或副作用说明 |

**多个场景**：可用多个 `@example` 块（如边界情况），每个块仍含 Input/Output。

### 接口 / 类型字段（强制）

每个公开字段须有**双语**说明（`/** … */` 或 `@description`），写清**用途 / 作用**（非重复字段名翻译）。

```typescript
export interface BrowserInitOptions {
  /** Ingest DSN URL for this project. 本项目的 ingest DSN 地址。 */
  dsn: string;
  /** URL patterns to drop; matched against `request.url`. 丢弃匹配的 URL（对照 `request.url`）。 */
  denyUrls?: Array<string | RegExp>;
}
```

类型级 `@example`：展示含主要字段的典型对象（当作 Input 形态）。

### 类型 / 接口：典型数据示例（建议）

无函数级「输出」时，用 `@example` 展示符合类型的 JSON/对象即可：

```typescript
/**
 * Error event payload sent by the SDK.
 * SDK 上报的错误事件载荷。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const event: ErrorEvent = {
 *   event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 *   timestamp: '2026-06-03T12:00:00.000Z',
 *   platform: 'javascript',
 *   level: 'error',
 *   sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
 * };
 * ```
 */
export interface ErrorEvent { ... }
```

### 调整函数 / 字段时的检查表

| 变更 | 必须同步 |
|------|----------|
| 改函数签名、返回值、副作用 | 双语说明 + `@example` Input/Output |
| 增删改接口 / 类字段 | 该字段用途说明；类型 `@example` 含新字段 |
| 改枚举成员 | 每个取值的用途说明 |
| 仅重构实现、行为不变 | 确认现有注释仍准确；不准则改 |

### 禁止

- 仅英文或仅中文（公开 API 说明）
- 函数无 `@example` 或无 Input/Output 标注
- 字段无用途说明、仅重复标识符英文名
- **改函数/字段却不更新注释或示例**
- 示例与实现不符、误导性输出
- 用机器翻译堆砌、重复第三语言

## 语言分工

| 内容 | 语言 |
|------|------|
| JSDoc 说明与 Input/Output 标签 | 英文 + 简体中文 |
| 标识符、类型名、commit | 英文 |
| `docs/` 用户文档 | 简体中文为主 |

## AI 协作要求

1. 新增或修改**公开导出函数**时：用途/作用 + 双语说明 + `@example`（Input/Output）**与代码同 diff**。
2. 新增或修改**公开类型 / 接口 / 枚举 / 类字段**时：每个字段用途说明 + 类型级 `@example`（有字段变更时更新示例对象）。
3. 审查 diff：缺注释、缺字段说明、示例与实现不一致 → 视为未完成。
4. 私有实现不强制；**公开 API 与 Prisma 模型字段不可缺**。

## 参考实现

- 函数示例：[@sentry-guardian/utils](../../packages/utils/src/)
- 类型示例：[@sentry-guardian/types](../../packages/types/src/event.ts)

## 相关文档

- [open-source.md](./open-source.md)
- [AGENTS.md](../../AGENTS.md)
- [delivery-checklist.md](./delivery-checklist.md)
