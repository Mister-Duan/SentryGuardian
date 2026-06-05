# Vue 3 + Vite 示例

演示 `@sentry-guardian/vue`：`vueIntegration` + `vueRouterIntegration`。

## 前置

1. 本地已启动 dsn + monitor（`pnpm dev` 或 Docker 全栈）
2. 已有 DSN（`db:seed` 或控制台 **项目** 页）

## 运行

```bash
cp .env.example .env   # 填入 VITE_DSN
pnpm install
pnpm dev
```

打开页面后点击 **Throw test error**，在控制台 Issue 列表查看。

## 相关文档

- [docs/learn/sdk-guide.md](../../docs/learn/sdk-guide.md)
- [packages/vue/README.md](../../packages/vue/README.md)
