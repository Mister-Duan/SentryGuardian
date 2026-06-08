# Source Map 入门与使用指南

本指南说明如何在 SentryGuardian 中启用 **堆栈符号化**与 **源码上下文**（Issue 详情 ±5 行源码），便于快速定位生产环境压缩代码中的真实出错位置。

## 你将得到什么

| 能力 | 说明 |
|------|------|
| **堆栈符号化** | 将 `assets/index-abc.js:1:2847` 还原为 `src/App.tsx:42` |
| **源码上下文** | Issue 详情点击 in-app 栈帧，展开出错行前后源码 |
| **In App / Library** | 区分业务代码与 `node_modules` 等三方库帧 |
| **Release 关联** | 按版本管理 Source Map，与 SDK 上报的 `release` 字段匹配 |

数据流：

```text
构建 (sourcemap) → 上传 .map 到 Release → SDK 上报 release + 压缩堆栈
                                              ↓
                              GET Issue 详情 → symbolicator → 控制台展示源码
```

---

## 前置条件

1. 已完成 [getting-started.md](../getting-started.md)：`pnpm dev`、控制台可登录。
2. SDK `init` 中设置 **`release`**，且与上传 Source Map 时使用的 **版本字符串完全一致**。
3. 构建产物开启 Source Map（Vite：`build.sourcemap: true`）。
4. 若使用数据库迁移：已执行 `pnpm --filter @sentry-guardian/database db:migrate`（含 `artifacts` 元数据字段）。

---

## 5 分钟本地入门（vanilla 示例）

以下在仓库 `examples/vanilla` 中验证全链路；release 固定为 **`vanilla-example@0.1.0`**（与 `main.js` 中 SDK 配置一致）。

### 1. 启动监控栈

```bash
# 仓库根目录
pnpm dev
```

### 2. 获取 projectId 与 JWT

1. 打开 http://localhost:5173 登录（seed：`admin@localhost` / `adminadmin`）。
2. **项目** 页复制 **projectId**（DSN 路径最后一段）。
3. 登录后 JWT 在浏览器 `localStorage` 键名 `sg_token`（DevTools → Application）。

### 3. 构建并上传 Source Map

```bash
cd examples/vanilla
cp .env.example .env   # 填入 VITE_DSN（可选，仅 dev 需要）

export SG_PROJECT_ID=<projectId>
export SG_TOKEN=<jwt>

pnpm build
```

构建时 `@sentry-guardian/vite-plugin` 会在 `closeBundle` 自动上传 `dist/**/*.map`（未设置 `SG_*` 时为 **dry-run**，仅打印日志）。

或使用 CLI 脚本：

```bash
pnpm upload-maps --project-id <projectId> --token <jwt>
```

### 4. 触发错误

```bash
pnpm dev
```

打开 http://localhost:5174/error ，点击 **throw Error**（或任意 JS 错误按钮）。

### 5. 在控制台确认

1. http://localhost:5173/issues — 等待约 3 秒（Grouper 轮询）。
2. 进入 Issue 详情 → **异常** 区域。
3. 点击 **In App** 栈帧 → 应看到：
   - 徽章 **已符号化**（或 **未找到 Source Map**）
   - 压缩位置 → 原始 `src/...` 路径
   - 源码上下文（若 map 含 `sourcesContent`）

---

## SDK 配置

`release` 是符号化的**唯一关联键**：事件 payload 中的 `release` 必须与 Monitor 中 Release 版本一致。

```javascript
import * as Sentry from '@sentry-guardian/browser';

Sentry.init({
  dsn: 'http://localhost:3001/api/sentry/envelope/<projectId>',
  environment: 'production',
  release: 'my-app@1.2.0', // 必须与上传 map 时的 --release / 插件 release 一致
});
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `release` | 推荐 | 版本字符串，如 `app@1.0.0`、`2026.06.08+sha` |
| `environment` | 否 | 与符号化无关，用于 Issue 筛选 |

未设置 `release` 的事件**不会**尝试符号化（symbolicator 直接返回原堆栈）。

---

## 上传 Source Map 的三种方式

### 方式 A — Vite 插件（推荐）

安装（monorepo 内已 workspace 引用）：

```bash
pnpm add -D @sentry-guardian/vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { sentryGuardianVitePlugin } from '@sentry-guardian/vite-plugin';

const release = 'my-app@1.2.0';

export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    sentryGuardianVitePlugin({
      projectId: process.env.SG_PROJECT_ID!,
      release,
      authToken: process.env.SG_TOKEN!,
      monitorUrl: process.env.MONITOR_API_URL ?? 'http://localhost:3002',
      urlPrefix: process.env.SG_URL_PREFIX, // 可选：CDN 前缀，写入 bundle_url
      dryRun: !process.env.SG_TOKEN,      // 本地无 token 时只打印
    }),
  ],
});
```

构建结束自动：创建 Release → 递归上传 `dist/**/*.map` → 写入 `bundle_url` / `debug_id`（若 map 内含）。

### 方式 B — CLI 脚本

```bash
node scripts/upload-sourcemaps.mjs \
  --project-id <projectId> \
  --token <jwt> \
  --release my-app@1.2.0 \
  --dir ./dist \
  --url-prefix https://cdn.example.com/assets
```

| 参数 | 说明 |
|------|------|
| `--project-id` | 项目 ID |
| `--token` | 控制台 JWT |
| `--release` | 版本号（与 SDK 一致） |
| `--dir` | 含 `.map` 的目录，默认 `./dist` |
| `--url-prefix` | 可选 CDN 前缀，用于栈帧 URL 匹配 |

环境变量 `MONITOR_API_URL` 默认 `http://localhost:3002`。

### 方式 C — 控制台手动上传

1. 打开 http://localhost:5173/releases
2. **创建版本**（版本号 = SDK `release`）
3. 选择版本 → 上传 `.map` 文件
4. 可选填写 **Bundle URL**（生产 CDN 上 JS 文件的完整 URL 前缀）

上传后可在 **制品列表** 查看 `bundle_url`、`debug_id`、`artifact_type`。

---

## 控制台使用

### Issue 详情 — 堆栈与源码

| UI 元素 | 含义 |
|---------|------|
| **In App** / **Library** | 业务代码 vs 三方库 |
| **已符号化** | 成功匹配 map 并还原位置 |
| **未找到 Source Map** | 无匹配 release/artifact 或 URL 不匹配 |
| 压缩位置 | 符号化前的 bundle 文件名与行号 |
| 源码块 | ±5 行，`is_error_line` 高亮 |

操作：点击 **In App** 帧展开/收起源码面板；默认展开栈顶 in-app 帧。

### Releases 页

- 版本列表与 artifact 数量
- 按版本查看制品：`name`、`bundle_url`、`debug_id`、`artifact_type`
- 支持上传 `map` 或 `source` 类型 artifact（源文件用于 map 无 `sourcesContent` 时的回退）

详见 [console-guide.md](./console-guide.md#issue-详情-issuesid)。

---

## CI 集成示例

```yaml
# .github/workflows/release.yml（片段）
- name: Build
  run: pnpm build
  env:
    SG_PROJECT_ID: ${{ secrets.SG_PROJECT_ID }}
    SG_TOKEN: ${{ secrets.SG_TOKEN }}
    SG_URL_PREFIX: https://cdn.example.com/assets

# 或未使用 Vite 插件时：
- name: Upload source maps
  run: |
    node scripts/upload-sourcemaps.mjs \
      --project-id "$SG_PROJECT_ID" \
      --token "$SG_TOKEN" \
      --release "${{ github.ref_name }}" \
      --dir ./dist \
      --url-prefix https://cdn.example.com/assets
  env:
    MONITOR_API_URL: https://monitor.example.com
```

**检查清单**

- [ ] SDK `release` 与 CI `--release` / 插件 `release` 相同
- [ ] 生产构建开启 `sourcemap: true`（或 `hidden` + 单独上传 map）
- [ ] 生产环境 `urlPrefix` 与浏览器加载 JS 的 URL 一致（便于匹配）
- [ ] map 文件不要部署到公网 CDN（仅上传到 Monitor，需 JWT）

---

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 堆栈仍是 `assets/*.js` | 未上传 map 或 `release` 不一致 | 核对事件上下文中的 **版本** 与 Releases 页 |
| 显示 **未找到 Source Map** | artifact 文件名/URL 与栈帧不匹配 | 上传时填 `bundle_url` 或 `--url-prefix` |
| 已符号化但无源码块 | map 无 `sourcesContent` | Vite 默认内嵌；或单独上传 `artifact_type=source` |
| 上传 413 / 过大 | 单文件 > 5MB | 按 chunk 拆分构建，分文件上传 |
| 插件 dry-run 无上传 | 未设 `SG_TOKEN` | 导出 token 或去掉 `dryRun` |
| 401 上传失败 | JWT 过期 | 重新登录获取 token |
| 旧 Issue 无符号化 | 事件入库时 release 已固定 | 新触发错误；或确认 latest_event 的 release |

---

## API 参考（摘要）

完整表见 [configuration.md](../configuration.md#rest-api-monitor)。

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/projects/:id/releases` | 创建 Release |
| `GET` | `/api/projects/:id/releases/:releaseId/artifacts` | 制品列表 |
| `POST` | `/api/projects/:id/releases/:releaseId/artifacts` | multipart：`file`；可选 `bundle_url`、`debug_id`、`artifact_type` |

符号化在 **`GET /api/issues/:id`**、**`GET /api/events/:id`** 响应中自动执行，无需单独 API。

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [getting-started.md](../getting-started.md) | 30 分钟跑通监控全链路 |
| [sdk-guide.md](./sdk-guide.md) | SDK 完整接入 |
| [console-guide.md](./console-guide.md) | 控制台各页面 |
| [configuration.md](../configuration.md) | 环境变量与 API 表 |
| [examples/README.md](../../examples/README.md) | 示例 E2E |
| [packages/vite-plugin/README.md](../../packages/vite-plugin/README.md) | 插件 API |
