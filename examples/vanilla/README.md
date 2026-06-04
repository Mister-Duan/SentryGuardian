# Vanilla 示例

在浏览器中验证 `@sentry-guardian/browser` 上报与本地 ingest（`:3001`）是否连通。

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
VITE_DSN='http://<publicKey>@localhost:3001/api/<projectId>' pnpm dev
```

本地 seed 与 `buildDsn` 对 `localhost` 使用 **`http://`**。若 DSN 仍写成 `https://`，SDK 的 `parseDsn` 也会在回环地址上改为 HTTP 上报；修改 DSN 或 SDK 后请重新构建 browser 包（见下方故障排查）。

## 验证

1. 打开 http://localhost:5174
2. 点击 **Throw test error**
3. 浏览器 DevTools → Network：应看到 `POST http://localhost:3001/api/<projectId>/envelope/` 返回 **201**
4. 约 3 秒后，在控制台 http://localhost:5173 的 Issue 列表中应出现新 Issue

## 故障排查

| 现象 | 处理 |
|------|------|
| `net::ERR_SSL_PROTOCOL_ERROR` | 上报 URL 仍是 `https://localhost` 时：执行 `pnpm --filter @sentry-guardian/core build && pnpm --filter @sentry-guardian/browser build`，重启本示例 `pnpm dev`；或把 `VITE_DSN` 改为 `http://` |
| 无上报请求 | 确认已设置 `VITE_DSN`（`main.js` 在缺少 DSN 时不会 `init`） |
| 401 / 403 | 使用 seed 完整 DSN，勿改 publicKey / projectId |
| 连接被拒绝 | 确认 `backend-dsn` 在 3001 监听：`curl http://localhost:3001/health` |

## 相关文档

- [configuration.md §DSN](../../docs/configuration.md#dsn-格式)
- [getting-started.md §第七步](../../docs/getting-started.md#第七步触发一条错误)
