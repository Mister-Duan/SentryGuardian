# @sentry-guardian/frontend-monitor

React + Vite + Tailwind 监控控制台（MVP）。

## 开发

```bash
pnpm --filter @sentry-guardian/frontend-monitor dev
```

默认通过 Vite 代理将 `/api` 转发到 `http://localhost:3002`（需先启动 monitor）。

## 生产构建

```bash
VITE_API_URL=https://your-monitor-host pnpm --filter @sentry-guardian/frontend-monitor build
```

静态资源在 `dist/`，由任意静态服务器托管；`VITE_API_URL` 指向 monitor API 根地址。
