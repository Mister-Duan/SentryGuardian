# 控制台使用指南

`apps/frontend/monitor` 提供的 Web UI：登录、Issue 排障、项目管理、Release / Source Map、性能事务、告警规则。

## 访问与登录

| 环境 | URL |
|------|-----|
| 本地开发 | http://localhost:5173 |
| Docker 全栈 | http://localhost:5173（`docker compose` 的 `frontend` 服务） |
| 生产 | 静态站点域名（部署 `dist/`） |

### 首次部署（无 seed）

空库首次访问时，打开 **http://localhost:5173/setup** 完成引导：创建组织、管理员账号与首个项目，页面会输出 DSN。

### 开发环境（已 seed）

| 字段 | 默认值 |
|------|--------|
| 邮箱 | `admin@localhost` |
| 密码 | `adminadmin` |

登录成功后 JWT 保存在浏览器 `localStorage`（键名 `sg_token`）。

## 导航结构

登录后顶部导航：

| 链接 | 路径 | 说明 |
|------|------|------|
| Issues | `/issues` | Issue 列表、搜索、趋势 |
| 项目 | `/projects` | 创建项目、复制 DSN、轮换 Key |
| Releases | `/releases` | Release 版本与 Source Map 上传 |
| 性能 | `/performance` | 事务（Web Vitals / 路由）列表 |
| 告警 | `/alerts` | Webhook / 邮件告警规则 |

## 页面说明

### 登录页 `/login`

- 已登录会自动跳转 `/issues`
- 失败显示「登录失败，请检查邮箱与密码」

### 首次引导 `/setup`

- 无需登录；`GET /api/setup/status` 返回 `configured: false` 时展示表单
- 提交后创建组织、管理员、默认项目，并展示 DSN
- 完成后跳转登录页

### Issue 列表 `/issues`

| 区域 | 说明 |
|------|------|
| 项目下拉框 | 切换 `project_id` 筛选 |
| 状态下拉框 | `unresolved` / `resolved` / `ignored` 或全部 |
| 搜索框 | 标题子串搜索（`search` 参数） |
| 环境 / Release | 按最近事件的 `environment`、`release` 筛选 |
| 分页 | 每页 20 条，`page` 翻页 |
| 趋势条 | 近 24 小时 Issue 新增趋势（`GET /api/projects/:id/trends`） |
| DSN 提示 | 当前项目的 ingest 地址，一键复制 |
| 刷新 | 手动刷新；列表每 10 秒自动轮询 |
| 表格 | 标题、状态（中文）、次数、最近发生时间 |

### Issue 详情 `/issues/:id`

| 区域 | 说明 |
|------|------|
| 标题与元信息 | 状态（中文）、次数、culprit |
| 状态按钮 | 标记为已解决 / 已忽略 / 未解决 |
| 上下文 | 环境、Release、页面 URL |
| 异常与堆栈 | 可读异常链；已上传 Source Map 时服务端符号化 |
| 面包屑 | 错误前的用户操作时间线 |
| 事件历史 | 分页列表，可跳转单条事件详情 |
| 评论 | 添加与查看 Issue 评论（活动流） |
| 原始 JSON | 可折叠查看完整 `latest_event` 载荷 |

### 事件详情 `/events/:id`

- 展示单条 `Event` 完整载荷（错误 or 事务）
- 堆栈经 symbolicator 解析（匹配 Release artifact）

### 项目 `/projects`

- 列出组织下所有项目及 DSN
- 创建新项目（`POST /api/projects`）
- 轮换 public key（`POST /api/projects/:id/rotate-key`），DSN 路径中的 `projectId` 不变

### Releases `/releases`

- 按项目查看 Release 列表
- 创建版本号
- 上传 `.map` 文件（multipart `file` 字段）
- CI 可用 `scripts/upload-sourcemaps.mjs` 批量上传

### 性能 `/performance`

- 展示 `event_type = TRANSACTION` 的事件（LCP、CLS、TTFB、路由导航等）
- 需 SDK 启用 `performanceIntegration` / `browserTracingIntegration`

### 告警 `/alerts`

| 触发类型 | 说明 |
|----------|------|
| `new_issue` | Grouper 创建新 Issue 时立即 Webhook |
| `error_rate` | 每小时维护任务扫描：过去 1 小时错误事件数 ≥ 阈值 |

支持配置 Webhook URL；邮件需服务端配置 `SMTP_HOST`（当前为日志桩，见 [configuration.md](../configuration.md)）。

## 与 Grouper 的时序

上报后 Issue **不会立刻出现**：

1. dsn 写入 `events`（`aggregated_at` 为空）
2. Grouper 默认每 **3 秒**处理一批
3. 刷新列表即可看到新 Issue 或 `event_count` 增加

调试时可临时设置 `GROUPER_POLL_MS=500` 缩短等待。

## API 对接（非 UI）

若你要自建控制台或脚本，使用 monitor REST API（全局前缀 `/api`）：

```bash
# 登录
curl -s -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@localhost","password":"adminadmin"}'

# Issue 列表（替换 TOKEN）
curl -s 'http://localhost:3002/api/issues?project_id=PROJECT_ID&page=1' \
  -H "Authorization: Bearer TOKEN"

# Issue 事件历史
curl -s 'http://localhost:3002/api/issues/ISSUE_ID/events?page=1' \
  -H "Authorization: Bearer TOKEN"
```

完整端点表见 [configuration.md](../configuration.md#控制台-rest-apimonitor)。

类型定义：`packages/types/src/api.ts`、`packages/types/src/event-api.ts`、`packages/types/src/performance.ts`。

## 前端部署配置

开发环境无需配置：Vite 代理 `/api` → `http://localhost:3002`。

生产构建：

```bash
VITE_API_URL=https://monitor.example.com \
  pnpm --filter @sentry-guardian/frontend-monitor build
```

将 `dist/` 部署到 Nginx / CDN；确保浏览器能访问 monitor API（生产收紧 `CORS_ORIGIN`）。

详见 [apps/frontend/monitor/README.md](../../apps/frontend/monitor/README.md)。

## 权限说明

- 单 Organization 场景；登录用户可见其组织下所有 Project
- 无细粒度 RBAC；无自助注册（除 `/setup` 首次引导）
- DSN 仅在已登录后通过 API 返回，不公开暴露在未授权接口

## 下一步

- 生产部署：[self-hosting.md](./self-hosting.md)
- 配置索引：[configuration.md](../configuration.md)
- Source Map 上传：[sdk-guide.md](./sdk-guide.md#source-map-与-release)
