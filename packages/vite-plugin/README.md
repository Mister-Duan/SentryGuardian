# @sentry-guardian/vite-plugin

Vite 插件：在 `vite build` 结束后自动将 `dist/**/*.map` 上传到 SentryGuardian Monitor Release API。

## 安装

```bash
pnpm add -D @sentry-guardian/vite-plugin
```

## 快速开始

```ts
import { defineConfig } from 'vite';
import { sentryGuardianVitePlugin } from '@sentry-guardian/vite-plugin';

const release = 'my-app@1.0.0';

export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    sentryGuardianVitePlugin({
      projectId: process.env.SG_PROJECT_ID!,
      release,
      authToken: process.env.SG_TOKEN!,
      monitorUrl: process.env.MONITOR_API_URL ?? 'http://localhost:3002',
      urlPrefix: process.env.SG_URL_PREFIX,
      dryRun: !process.env.SG_TOKEN,
    }),
  ],
});
```

SDK 必须使用相同 release：

```ts
Sentry.init({ dsn: '...', release: 'my-app@1.0.0' });
```

## 选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `projectId` | `string` | 项目 ID |
| `release` | `string \| () => string` | Release 版本 |
| `authToken` | `string` | 控制台 JWT |
| `monitorUrl` | `string` | 默认 `http://localhost:3002` |
| `urlPrefix` | `string` | CDN 前缀，写入 `bundle_url` |
| `outDir` | `string` | 扫描目录，默认 Vite `outDir` 或 `dist` |
| `dryRun` | `boolean` | 仅日志，不上传 |

## 环境变量（常用）

| 变量 | 说明 |
|------|------|
| `SG_PROJECT_ID` | 项目 ID |
| `SG_TOKEN` | JWT |
| `MONITOR_API_URL` | Monitor API 根 URL |
| `SG_URL_PREFIX` | CDN 前缀 |

## 编程式上传

```ts
import { uploadArtifactsFromDir } from '@sentry-guardian/vite-plugin/upload';

await uploadArtifactsFromDir({
  monitorUrl: 'http://localhost:3002',
  projectId: 'proj_xxx',
  authToken: token,
  release: 'app@1.0.0',
  dir: './dist',
  urlPrefix: 'https://cdn.example.com/assets',
});
```

## 文档

- [Source Map 入门与使用](../../docs/learn/source-map-guide.md)
- [configuration.md](../../docs/configuration.md)
