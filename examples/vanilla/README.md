# Vanilla 示例

1. 启动 Postgres + 迁移 + seed（见根目录 README）
2. 设置 `VITE_DSN` 为 seed 输出的 DSN
3. `pnpm dev`

```bash
VITE_DSN='https://<publicKey>@localhost:3001/api/<projectId>' pnpm dev
```

点击 **Throw test error** 触发上报。
