# 示例索引

用于验证 `@sentry-guardian/browser` 默认集成的**全部错误采集类型**、**性能事务（Web Vitals / 慢请求）**与监控控制台展示。

## 示例项目

| 目录 | 端口 | 说明 |
|------|------|------|
| [vanilla](./vanilla/) | 5174 | 纯 JS + Vite，错误 + 性能按钮面板 |
| [vue-vite](./vue-vite/) | 5175 | Vue 3 + `vueIntegration`，含 vanilla 全部演示 + 组件错误 |

共享逻辑：

| 文件 | 说明 |
|------|------|
| `shared/error-demos.js` | 错误演示清单 |
| `shared/performance-demos.js` | 性能演示清单 |
| `shared/demo-routes.js` | `/error` · `/perf` Tab 路由 |
| `shared/example-performance.js` | `performanceIntegration` + `browserTracingIntegration` |
| `shared/vite-mock-api.js` | `/mock/404`、`/mock/500`、`/mock/slow` |

## 错误类型对照表

| 分类 | 演示按钮 | SDK 机制 / 标签 |
|------|----------|-----------------|
| JavaScript | throw Error、TypeError、ReferenceError、Error.cause | `onerror` |
| Promise | 未处理拒绝、reject 字符串 | `onunhandledrejection` |
| 资源 | script / img / link / iframe / video / audio 404 | `onerror` · `error.type: resource` |
| HTTP | Fetch 404/500/网络错误、XHR 404/500 | `http.client` / `xhr` |
| Console | console.error、console.warn | `console` |
| 手动 API | captureException、captureMessage | `generic` |
| CSP | [csp-lab.html](./vanilla/csp-lab.html) 独立页 | `onsecuritypolicyviolation` |
| Vue（仅 vue-vite） | 组件内 throw | `vueIntegration` → `captureException` |

## 性能演示对照表（`/perf`）

SDK 通过 `shared/example-performance.js` 启用 `performanceIntegration`（perfume.js）与 `browserTracingIntegration`（慢请求阈值 300ms）。面板文案区分 **perfume `analyticsTracker` 时机** 与 **SDK 上报**。详见 [performance-metrics.md](../docs/learn/performance-metrics.md)。

**perfume 通则**：多数指标经 `requestIdleCallback` 才进 `analyticsTracker`；**CLS / INP** 在 `document.hidden` 时**同步**回调。SDK 默认 `lcp.reportAllChanges`，Vitals 立即 POST，`resource.timing` 约 400ms 批量。

| 分组 | 演示按钮 | 存储 `metric` | perfume 触发 / 回调时机 |
|------|----------|---------------|-------------------------|
| Web Vitals | 刷新页面 | TTFB、FCP、`nav.*`、`network.info`、`storage.estimate` | initPerfume + web-vitals；**idle 后**回调 |
| Web Vitals | 切 Tab（CLS/INP） | CLS、INP | hidden 时**同步**回调；需先有偏移或交互 |
| Web Vitals | 触发 LCP 更新 | LCP | web-vitals LCP 变化；SDK reportAllChanges，**可见时也可上报** |
| Web Vitals | 触发 CLS | CLS | 布局偏移；**hidden 同步**回调 |
| Web Vitals | 首次点击（FID） | FID | 首次输入；idle 后回调 |
| Web Vitals | 慢交互（INP） | INP | 需交互；会话最慢值；**hidden 同步**回调 |
| Web Vitals | 长任务（TBT） | TBT | FCP 后 longtask；**FID 后 10s 且页面仍可见** |
| 阻塞与重定向 | markNTBT | NTBT | `markNTBT()` 后 2s 内 longtask；idle 后回调 |
| 阻塞与重定向 | 经重定向加载 | RT、`nav.redirect` | initPerfume 时 `redirectTime>0` |
| 元素计时 | 插入 elementtiming | `ET.{id}` | Element Timing 观察器；idle 后回调 |
| 资源与流量 | 动态加载脚本 | `resource.timing` | 每资源一条；idle 后；SDK 批量发送 |
| 资源与流量 | 拉取资源 | `data.*` | FID 后 10s 且页面可见时汇总 |
| 用户旅程 | markStep | `userJourneyStep` | `steps` + 起止 mark；idle 后回调 |
| 用户旅程 | trackUJNavigation | — | 仅清理 stale step，不上报 |
| 用户旅程 | start / end | `perf.measure.*` | User Timing；idle 后回调 |
| 慢请求 | 慢 Fetch | `http.client` | 非 perfume；fetch 耗时 > 阈值 |

## 快速开始

```bash
# 根目录已 pnpm dev（dsn :3001 + 控制台 :5173）
cd examples/vanilla
cp .env.example .env   # 填入 seed 输出的 VITE_DSN
pnpm dev
```

1. 打开 http://localhost:5174/error（错误）或 http://localhost:5174/perf（性能）；根路径 `/` 自动跳转到 `/error`
2. 打开 http://localhost:5173 → **Issues**（错误）或 **性能** 页查看上报结果

## 相关文档

- [getting-started.md](../docs/getting-started.md)
- [sdk-guide.md](../docs/learn/sdk-guide.md) — 性能集成说明
