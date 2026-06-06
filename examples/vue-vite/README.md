# Vue 3 + Vite 错误与性能演示

演示 `@sentry-guardian/vue`（`vueIntegration`）、browser SDK 默认**错误集成**与 **性能集成**（Web Vitals、慢 Fetch）。

与 `examples/vanilla` 共用 `shared/error-demos.js`、`shared/performance-demos.js`，并额外提供 **Vue 组件内 throw** 演示。

## 前置

1. 本地已启动 dsn + monitor（`pnpm dev` 或 Docker 全栈）
2. 已有 DSN（`db:seed` 或控制台 **项目** 页）

## 运行

```bash
cp .env.example .env   # 填入 VITE_DSN
pnpm install
pnpm dev
```

默认端口 **5175**（避免与 vanilla :5174 冲突）。

打开页面后按分组点击按钮；性能数据在控制台 **性能** 页查看。CSP 实验页请运行 vanilla 示例后访问 http://localhost:5174/csp-lab.html 。

## 相关文档

- [examples/README.md](../README.md)
- [docs/learn/sdk-guide.md](../../docs/learn/sdk-guide.md)
- [packages/vue/README.md](../../packages/vue/README.md)
