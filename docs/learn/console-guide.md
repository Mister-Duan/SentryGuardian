# 控制台使用指南

`apps/frontend/monitor` 提供的 Web UI，用于登录、查看 Issue、修改状态。

## 访问与登录

| 环境 | URL |
|------|-----|
| 本地开发 | http://localhost:5173 |
| 生产 | 静态站点域名（由你部署 `dist/`） |

默认账号（seed 生成，生产务必修改）：

| 字段 | 默认值 |
|------|--------|
| 邮箱 | `admin@localhost` |
| 密码 | `adminadmin` |

登录成功后 JWT 保存在浏览器 `localStorage`（键名 `sg_token`）。

## 页面说明

### 登录页 `/login`

- 已登录会自动跳转 `/issues`
- 失败显示「登录失败，请检查邮箱与密码」

### Issue 列表 `/issues`

| 区域 | 说明 |
|------|------|
| 项目下拉框 | 切换 `project_id` 筛选 |
| DSN 提示 | 当前项目 ingest 地址，可复制到 SDK |
| 表格 | 标题、状态、次数、最近发生时间 |
| 退出 | 清除 token 返回登录 |

列表数据来自 `GET /api/issues?project_id=...`，按 `last_seen` 降序。

### Issue 详情 `/issues/:id`

| 区域 | 说明 |
|------|------|
| 标题与元信息 | status、event_count、culprit |
| 状态按钮 | `resolved` / `ignored` / `unresolved` |
| 最近事件 | `latest_event` 的 JSON（含 exception、breadcrumbs） |

修改状态调用 `PATCH /api/issues/:id`。

## 与 Grouper 的时序

上报后 Issue **不会立刻出现**：

1. dsn 写入 `events`（`aggregated_at` 为空）
2. Grouper 默认每 **3 秒**处理一批
3. 刷新列表即可看到新 Issue 或 `event_count` 增加

调试时可临时设置 `GROUPER_POLL_MS=500` 缩短等待。

## API 对接（非 UI）

若你要自建控制台或脚本，使用 monitor REST API：

```bash
# 登录
curl -s -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@localhost","password":"adminadmin"}'

# 列表（替换 TOKEN）
curl -s http://localhost:3002/api/issues \
  -H "Authorization: Bearer TOKEN"
```

类型与字段见 `packages/types/src/api.ts` 与 [configuration.md](../configuration.md#控制台-rest-apimonitor)。

## 前端部署配置

开发环境无需配置：Vite 代理 `/api` → `http://localhost:3002`。

生产构建：

```bash
VITE_API_URL=https://monitor.example.com \
  pnpm --filter @sentry-guardian/frontend-monitor build
```

将 `dist/` 部署到 Nginx / CDN；确保浏览器能访问 monitor API（CORS 已允许时需配置 `CORS_ORIGIN`）。

详见 [apps/frontend/monitor/README.md](../../apps/frontend/monitor/README.md)。

## 权限说明（MVP）

- 单 Organization 场景；登录用户可见其组织下所有 Project
- 无细粒度 RBAC；无自助注册
- DSN 仅在已登录后通过 API 返回，不公开暴露在未授权接口

## 下一步

- 生产部署：[self-hosting.md](./self-hosting.md)
- 配置索引：[configuration.md](../configuration.md)
