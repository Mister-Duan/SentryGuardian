# 性能采集设计（perfume.js）

## 架构

浏览器性能由 **[perfume.js](https://github.com/Zizzamia/perfume.js)**（MIT）统一采集，经 `perfume-bridge` 映射为 `captureTransaction` 事务事件。

```text
perfume.js initPerfume
  → analyticsTracker
  → mapPerfumeReport (integrations/perfume-bridge.ts)
  → performance-batch → Client.captureTransactions → ingest
```

不再使用自研 `instant` / `standard` 双模式或 `vital_reporting` 字段。

## 批量与卸载

`performance-batch.ts` 在 `mapPerfumeReport` 之后合并事务，减少 ingest POST 次数：

| 策略 | 指标 | 行为 |
|------|------|------|
| **立即 flush** | `TTFB`、`FCP`、`LCP`、`CLS`、`FID`、`INP`、`TBT`、`NTBT`、`RT`、`network.info`、`storage.estimate`，以及 `nav.*` 前缀 | 调用 `Client.captureTransactions`（异步，经 `BufferTransport`） |
| **延迟批量（默认 400ms）** | `resource.timing`、`data.*`、`ET.*`、`userJourneyStep`、`perf.measure.*` 等 | 定时或满批（默认 30 条）后 `captureTransactions` |
| **页面 hidden** | 上述 pending 批量队列 | `visibilitychange` → `hidden` 时 `setTimeout(0)` 后 `captureTransactionsSync`（等 perfume 入队 CLS/INP） |
| **页面卸载** | 批量 pending + 已缓冲 envelope | `performance-batch` 的 `pagehide` 同步 flush pending；`page-lifecycle.ts` 的 `pagehide` 调用 `client.flushSync()` 排空 `BufferTransport` |

卸载同步路径：`captureTransactionsSync` / `flushSync` → `FetchTransport.sendSync`（`navigator.sendBeacon`，Blob `Content-Type: application/x-sentry-guardian-envelope`）。

### ingest 成功码

`BufferTransport` 将 **任意 2xx**（含 ingest 返回的 **201 Created**）视为成功并清空缓冲；非 2xx 或 429 按重试策略处理。单 envelope 可含多条 `transaction` item（`createTransactionsEnvelope`）。

## 默认 reportOptions

`performanceIntegration` 向 `initPerfume` 注入：

```typescript
reportOptions: {
  lcp: { reportAllChanges: true, ...options.reportOptions?.lcp },
  // cls / fcp / fid / inp / ttfb 透传用户配置
}
```

SDK **有意**将 LCP 设为 `reportAllChanges: true`（覆盖 perfume 默认），使 LCP 在页面仍可见时即可进入 `analyticsTracker` 并上报；CLS/INP 仍主要在 `document.hidden` 时由 perfume 同步入队。

## 指标映射

完整 **metricName 含义、时间段、控制台行为** 见用户文档 [performance-metrics.md](../learn/performance-metrics.md)。

维护时以 `perfume-bridge.ts` 为权威实现；上表仅作索引：

| perfume `metricName` | 存储 `metric`（摘要） |
|----------------------|------------------------|
| TTFB, FCP, LCP, CLS, FID, INP | 同名 |
| TBT, NTBT, RT | 同名 |
| ET | `ET.{identifier}` |
| navigationTiming | `nav.*`（跳过 `timeToFirstByte`） |
| networkInformation / storageEstimate | `network.info` / `storage.estimate` |
| dataConsumption | `data.{type}` |
| resourceTiming | `resource.timing` |
| userJourneyStep / 自定义 | `userJourneyStep` / `perf.measure.*` |

## 集成选项

`performanceIntegration({ resourceTiming?, elementTiming?, maxMeasureTime?, steps?, onMarkStep?, denyUrls?, ignoreIngest? })`  
默认 `resourceTiming: true`、`elementTiming: true`、`ignoreIngest: true`。

`browserTracingIntegration({ slowThresholdMs?, denyUrls?, ignoreIngest? })` 同样支持性能 URL 过滤。

### ingest URL 排除

`resolvePerformanceDenyUrls`（`packages/browser/src/performance/resolve-deny-urls.ts`）在集成 `setup` 时根据 `ClientOptions.dsn`、`ingestUrl`（`init` 中 `tunnel ?? envelopeUrl`）合并默认排除列表；除完整 `envelopeUrl` 外还加入路径模式 `/api/sentry/envelope/{projectId}` 与 `/api/sentry/envelope/`（兼容 `localhost` / `127.0.0.1` 主机差异）。用户 `denyUrls` 追加。匹配逻辑与 `inboundFilters` 共用 `urlMatches`（`lib/url-match.ts`）。**修改 browser SDK 后须 `pnpm --filter @sentry-guardian/browser build`（或 `dev:packages` watch）**，示例通过 `dist` 消费 workspace 包。

- `resourceTiming`：`performanceIntegration` + `mapPerfumeReport` filter
- `http.client`：`browserTracingIntegration` 在 `captureTransaction` 前过滤
- **不**作用于错误 `inboundFilters`；**不**过滤 `dataConsumption`（聚合 KB）

## 子路径与 SPA API

| 子路径 | 导出 |
|--------|------|
| `@sentry-guardian/browser/performance` | `performanceIntegration`、`markNTBT`, `markStep`, `markStepOnce`, `trackUJNavigation`, `start`, `end`, `clear`（perfume.js） |
| `@sentry-guardian/browser/tracing` | `browserTracingIntegration`（不含 perfume.js） |

主入口 `@sentry-guardian/browser` 仅含错误监控与 P0 集成，**不**导出上述性能 API，以便应用 bundle tree-shake。

## 维护

- 依赖：`perfume.js@^9.4`（内含 `web-vitals`）
- 升级时对照 perfume CHANGELOG 与 `perfume-bridge.test.ts`
- 改映射或公开选项须同步 `docs/learn/sdk-guide.md`、`CHANGELOG.md`
