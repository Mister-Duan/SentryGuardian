# Vanilla 错误类型演示

在浏览器中验证 `@sentry-guardian/browser` **默认集成**捕获的全部错误类型，并在监控控制台查看可视化。

## 前置条件

1. 根目录已完成 [getting-started.md](../../docs/getting-started.md) 中的数据库与 `pnpm dev`（或单独启动 dsn :3001）。
2. 已执行 `db:seed` 并记下输出的 **DSN**。

## 配置 DSN

**方式 A — `.env`（推荐）**

```bash
cp .env.example .env
# 编辑 .env，将 VITE_DSN 设为 seed 输出的 DSN
pnpm dev
```

**方式 B — 命令行**

```bash
VITE_DSN='http://localhost:3001/api/sentry/<projectId>' pnpm dev
```

## 验证

1. 打开 http://localhost:5174
2. 按分组点击按钮（JavaScript、Promise、资源、HTTP、Console、手动 API 等）
3. DevTools → Network：应看到 `POST …/envelope/` 返回 **201**
4. 控制台 http://localhost:5173：Issue 列表、**错误分布图**、Issue 详情中的类型/来源图表

### CSP 违规

主页面 CSP 过严会破坏 Vite HMR，因此使用独立页：

- http://localhost:5174/csp-lab.html
- 或点击面板中的 **打开 CSP 实验页**

### HTTP 模拟接口

开发服务器内置：

- `GET /mock/404`
- `GET /mock/500`

## 故障排查

| 现象 | 处理 |
|------|------|
| `net::ERR_SSL_PROTOCOL_ERROR` | 将 `VITE_DSN` 改为 `http://`；或重建 browser 包 |
| 无上报请求 | 确认已设置 `VITE_DSN` |
| 401 / 403 | 使用 seed 完整 DSN |
| 连接被拒绝 | `curl http://localhost:3001/health` |

## 相关文档

- [examples/README.md](../README.md) — 全量错误类型索引
- [configuration.md](../../docs/configuration.md)
