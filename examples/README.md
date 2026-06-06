# 示例索引

用于验证 `@sentry-guardian/browser` 默认集成的**全部错误采集类型**与监控控制台展示。

## 示例项目

| 目录 | 端口 | 说明 |
|------|------|------|
| [vanilla](./vanilla/) | 5174 | 纯 JS + Vite，完整错误类型按钮面板 |
| [vue-vite](./vue-vite/) | 5175 | Vue 3 + `vueIntegration`，含 vanilla 全部演示 + 组件错误 |

共享逻辑：`shared/error-demos.js`（演示清单）、`shared/vite-mock-api.js`（`/mock/404`、`/mock/500`）。

## 错误类型对照表

| 分类 | 演示按钮 | SDK 机制 / 标签 |
|------|----------|-----------------|
| JavaScript | throw Error、TypeError、ReferenceError、Error.cause | `onerror` |
| Promise | 未处理拒绝、reject 字符串 | `onunhandledrejection` |
| 资源 | script / img / link / iframe / video / audio 404 | `onerror` · `error.type: resource` |
| HTTP | Fetch 404/500/网络错误、XHR 404/500 | `http.client` / `xhr` |
| Console | console.error、console.warn | `console` |
| 手动 API | captureException、captureMessage | `generic` |
| CSP | [csp-lab.html](./vanilla/csp-lab.html) 独立页 | `onsecuritypolicyviolation` |
| Vue（仅 vue-vite） | 组件内 throw | `vueIntegration` → `captureException` |

## 快速开始

```bash
# 根目录已 pnpm dev（dsn :3001 + 控制台 :5173）
cd examples/vanilla
cp .env.example .env   # 填入 seed 输出的 VITE_DSN
pnpm dev
```

打开 http://localhost:5174 ，逐类点击按钮，在 http://localhost:5173 查看 Issue 列表、错误分布图与事件详情。

## 相关文档

- [getting-started.md](../docs/getting-started.md)
- [sdk-guide.md](../docs/learn/sdk-guide.md)
