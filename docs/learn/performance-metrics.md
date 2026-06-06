# 性能指标参考（perfume.js）

浏览器性能由 **[perfume.js](https://github.com/Zizzamia/perfume.js)** 采集，经 `perfume-bridge` 映射为 `captureTransaction` 事务事件后入库。本文说明 **perfume `metricName` → 控制台 `metric`** 的对应关系，以及各字段含义。

> 架构与集成选项见 [performance-design.md](../ai-guide/performance-design.md)；SDK 接入见 [sdk-guide.md](./sdk-guide.md#性能监控)。

## 数据流

```text
perfume.js initPerfume
  → analyticsTracker({ metricName, data, rating, attribution, navigatorInformation, navigationType })
  → mapPerfumeReport (packages/browser/src/integrations/perfume-bridge.ts)
  → captureTransaction → Envelope (type: transaction)
  → POST {scheme}://{host}/api/sentry/envelope/{projectId}/
  → 后端 TRANSACTION 事件 → 控制台 /performance
```

上报接口与 DSN 格式见 [configuration.md](../configuration.md#dsn-格式)。

**Breaking（相对旧版）**：已移除 `vital_reporting`（`instant` / `standard`）双模式；每条事务仅保留 perfume.js 语义下的**一条最终/会话级**样本（Web Vitals 由 `web-vitals` 库保证）。

## 事务字段说明

| 字段 | 含义 |
|------|------|
| `transaction` | 事务类型名（如 `largest-contentful-paint`、`resource.timing`） |
| `duration_ms` | 耗时（毫秒）；CLS、`nav.headerSize`、纯上下文类指标多为 `0` |
| `metric` | **控制台筛选与展示用的指标键**（见下表） |
| `metric_value` | 指标原始值：毫秒、CLS 分数、或 KB（`data.*`） |
| `metric_rating` | `good` / `needs-improvement` / `poor`（perfume / web-vitals 评级，部分指标无） |
| `navigation_type` | `navigate` / `reload` / `back-forward` / `back-forward-cache` / `prerender` |
| `url` | 资源 URL（`resource.timing`）或慢请求 URL（`http.client`） |
| `perf_context` | JSON：`attribution`、`navigator`（设备内存、CPU、低端机判断等）、扩展上下文 |

控制台 **Vital P75 概览**仅聚合核心 Web Vitals：`LCP`、`CLS`、`TTFB`、`FCP`、`INP`、`FID`、`TBT`。其余指标在事务列表与分布图中展示。

---

## 一、Web Vitals（数值型 `metricName`）

perfume `data` 为 **number**。时间类指标的时间起点均为 **本次页面导航开始**（`performance.timeOrigin`），除非另有说明。

| perfume `metricName` | 存储 `metric` | `transaction` | `metric_value` 含义 | 时间段（从 → 到） | 上报时机 | 评级 |
|----------------------|---------------|---------------|---------------------|-------------------|----------|------|
| **TTFB** | `TTFB` | `time-to-first-byte` | 首字节时间（ms） | 导航开始 → 收到响应第一个字节 | 页面加载早期，一次/会话 | 有 |
| **FCP** | `FCP` | `first-contentful-paint` | 首次内容绘制（ms） | 导航开始 → 首次绘制文字/图像 | 首次 FCP 时，一次/会话 | 有 |
| **LCP** | `LCP` | `largest-contentful-paint` | 最大内容绘制（ms） | 导航开始 → **会话内最终** LCP 元素绘制完成 | SDK 默认 `reportAllChanges`：每次 LCP 更新可上报；最终值亦在 `hidden` 时上报 | 有 |
| **CLS** | `CLS` | `cumulative-layout-shift` | 累计布局偏移分数（0～1+，**非毫秒**） | 整次访问内有效 layout-shift 累加 | 页面 `hidden` 时 | 有 |
| **FID** | `FID` | `first-input-delay` | 首次输入延迟（ms） | 首次用户输入 → 浏览器开始处理 | 首次交互时（部分浏览器已弱化） | 有 |
| **INP** | `INP` | `interaction` | 会话内最慢交互延迟（ms） | 单次交互：输入 → 下一帧响应；取会话 **最大值** | 页面 `hidden` 时 | 有 |

**读表提示**

- `duration_ms` 与 `metric_value` 在 Web Vitals 中通常一致；**CLS** 的 `duration_ms` 固定为 `0`，只看 `metric_value`。
- LCP / CLS / INP 符合 [Web Vitals](https://web.dev/vitals/) 会话语义，不是每条 PerformanceObserver 中间值。

---

## 二、阻塞与重定向（数值型）

| perfume `metricName` | 存储 `metric` | `transaction` | `metric_value` 含义 | 时间段 / 条件 | 上报时机 | 评级 |
|----------------------|---------------|---------------|---------------------|---------------|----------|------|
| **TBT** | `TBT` | `total-blocking-time` | 总阻塞时间（ms） | FCP 之后 longtask 阻塞时间累加 | FID 后约 10s（页面仍可见） | 有 |
| **NTBT** | `NTBT` | `navigation-total-blocking-time` | 导航后 2s 内阻塞时间（ms） | 调用 `markNTBT()` 起 2s 窗口内 longtask | SPA 路由切换后手动 `markNTBT()` | 有 |
| **RT** | `RT` | `redirect-time` | 重定向耗时（ms） | 重定向链耗时 | `initPerfume` 时，若 `redirectTime > 0` | 有 |

```typescript
import { markNTBT, trackUJNavigation } from '@sentry-guardian/browser';

router.listen(() => {
  markNTBT();           // 开始 NTBT 2s 窗口
  trackUJNavigation();  // 用户旅程：清理过期 step
});
```

---

## 三、元素计时（数值型 `ET`）

| perfume `metricName` | 存储 `metric` | `transaction` | 含义 | 条件 |
|----------------------|---------------|---------------|------|------|
| **ET** | `ET.{identifier}` | `element-timing.{identifier}` | 元素出现在屏幕上的时间（ms） | HTML 设置 `elementtiming="{identifier}"`，且 `elementTiming: true` |

示例：

```html
<h1 elementtiming="elPageTitle">标题</h1>
```

→ `metric = ET.elPageTitle`，`metric_value` 为渲染耗时（ms），`attribution.identifier` 在 `perf_context` 中。

---

## 四、导航分解（对象型 `navigationTiming`）

perfume 一次上报 `metricName: 'navigationTiming'`，`data` 为对象；本项目 **拆成多条** 事务（跳过 `timeToFirstByte`，避免与 Vital **TTFB** 重复）。

| `data` 字段 | 存储 `metric` | `metric_value` | 含义 | 时间段 |
|-------------|---------------|----------------|------|--------|
| `redirectTime` | `nav.redirect` | ms | 重定向耗时 | 同 **RT** |
| `dnsLookupTime` | `nav.dns` | ms | DNS 查询 | 导航开始 → DNS 完成 |
| `fetchTime` | `nav.fetch` | ms | 缓存查找 + 响应 | 请求阶段 |
| `workerTime` | `nav.worker` | ms | Service Worker + 响应 | SW 介入时 |
| `totalTime` | `nav.total` | ms | 请求+响应总网络时间 | 网络阶段 |
| `downloadTime` | `nav.download` | ms | 响应体下载 | 下载阶段 |
| `headerSize` | `nav.headerSize` | 字节数 | 响应头大小 | `duration_ms = 0` |
| `timeToFirstByte` | — | — | **不单独存储** | 已由 Vital `TTFB` 覆盖 |

`transaction` 均为 `navigation.timing`。

---

## 五、网络与存储（对象型，无单一 `metric_value`）

整包写入 `perf_context`，`duration_ms = 0`。

| perfume `metricName` | 存储 `metric` | `transaction` | `perf_context` 内容 |
|----------------------|---------------|---------------|---------------------|
| **networkInformation** | `network.info` | `network.information` | `network`: `effectiveType`、`downlink`、`rtt`、`saveData` 等 |
| **storageEstimate** | `storage.estimate` | `storage.estimate` | `storage`: `quota`、`usage`、各存储分项（KB） |

同时每条都附带 `perf_context.navigator`：设备内存、CPU 核数、`isLowEndDevice`、`isLowEndExperience`、`serviceWorkerStatus`。

---

## 六、资源与流量

### `resourceTiming`（每条资源一条事务）

| perfume `metricName` | 存储 `metric` | `transaction` | 字段说明 |
|----------------------|---------------|---------------|----------|
| **resourceTiming** | `resource.timing` | `resource.timing` | `url` = 资源 URL；`metric_value` / `duration_ms` = 加载耗时（ms）；`perf_context.initiatorType`、`transferSize` |

需 `performanceIntegration({ resourceTiming: true })`（**默认已开**）。每个 script/css/img 等加载完成上报一条。

### `dataConsumption`（按类型拆条）

perfume 在 FID 后约 10s 汇总页面资源体积；本项目按类型拆成多条：

| perfume `data` 键 | 存储 `metric` | `metric_value` | 单位 |
|-----------------|---------------|----------------|------|
| `beacon` | `data.beacon` | KB | KB |
| `css` | `data.css` | KB | KB |
| `fetch` | `data.fetch` | KB | KB |
| `img` | `data.img` | KB | KB |
| `script` | `data.script` | KB | KB |
| `xmlhttprequest` | `data.xmlhttprequest` | KB | KB |
| `other` | `data.other` | KB | KB |
| `total` | `data.total` | KB | KB |

`transaction` = `data.consumption`，`duration_ms = 0`，`perf_context.unit = 'KB'`。

---

## 七、用户旅程与自定义计时

| perfume `metricName` | 存储 `metric` | `transaction` | 含义 | 配置 |
|----------------------|---------------|---------------|------|------|
| **userJourneyStep** | `userJourneyStep` | `user.journey` | 步骤耗时（ms） | `initPerfume({ steps })` + `markStep('start')` / `markStep('end')`；`perf_context.stepName` |
| *自定义字符串* | 同名或见下 | `perf.measure.{name}` | `start(name)` → `end(name)` 测得的耗时（ms） | 调用 `start` / `end` |

`userJourneyStep` 的 `data` 为步骤持续时间（number）。自定义 User Timing 的 `metricName` 即 `start`/`end` 时传入的名称。

---

## 八、非 perfume：`browserTracingIntegration`

| 来源 | `metric` | `transaction` | 含义 |
|------|----------|---------------|------|
| 慢 fetch 包装 | —（无 `metric`） | `http.client` | `duration_ms` = 请求发起到结束；`url`、`status_code` |

与 Web Vitals 时间轴无关，按墙钟时间计。

---

## 九、控制台与 API 速查

| 操作 | 说明 |
|------|------|
| 筛选 LCP | 性能页 pill：`类型 is LCP`；API `?metric=LCP` |
| 筛选资源 | `?metric=resource.timing` |
| 筛选慢请求 | `?metric=http.client`（按 `transaction` 特殊处理） |
| 概览 P75 | 仅 `LCP` / `CLS` / `TTFB` / `FCP` / `INP` / `FID` / `TBT` |
| 评级列 | 展示 `metric_rating`（良好 / 待改进 / 较差） |

API：`GET /api/projects/:id/performance-summary`、`GET .../transactions`（`since` / `until` / `metric` / 分页）。详见 [configuration.md](../configuration.md)。

---

## 十、`metricName` → `metric` 速查总表

| perfume `metricName` | 本项目 `metric`（可能多条） |
|----------------------|------------------------------|
| TTFB | `TTFB` |
| FCP | `FCP` |
| LCP | `LCP` |
| CLS | `CLS` |
| FID | `FID` |
| INP | `INP` |
| TBT | `TBT` |
| NTBT | `NTBT` |
| RT | `RT` |
| ET | `ET.{elementtiming}` |
| navigationTiming | `nav.redirect`, `nav.dns`, `nav.download`, `nav.fetch`, `nav.worker`, `nav.total`, `nav.headerSize` |
| networkInformation | `network.info` |
| storageEstimate | `storage.estimate` |
| dataConsumption | `data.beacon`, `data.css`, `data.fetch`, `data.img`, `data.script`, `data.xmlhttprequest`, `data.other`, `data.total` |
| resourceTiming | `resource.timing`（每条资源） |
| userJourneyStep | `userJourneyStep` |
| *自定义* | `perf.measure.{name}` 或自定义 `metricName` |

类型定义：`packages/types/src/performance.ts`。映射实现：`packages/browser/src/integrations/perfume-bridge.ts`。

---

## 十一、常见问题：刷新后只有「导航 fetch」？

这是**预期行为叠加采集时机**导致的表象，不是控制台丢数据。

### 为什么 `nav.fetch` 最容易先出现？

1. **`navigationTiming` 在 `initPerfume` 时立即采集**，且本地 Vite 开发页往往只有 `fetchTime > 0`（DNS、重定向、下载等字段为 0 时会被映射层过滤，见 `perfume-bridge.ts` 的 `value > 0` 条件）。
2. **perfume.js 将多数指标推迟到 `requestIdleCallback`** 再调用 `analyticsTracker`，不会与导航分解同时到达控制台。
3. **会话级指标时机不同**：**CLS / INP** 主要在页面 `hidden`（切 Tab、最小化）时由 perfume 同步上报最终值；**LCP** 在 SDK 默认 `lcp.reportAllChanges: true` 下，每次最大内容更新即可出现在控制台，最终值亦在 `hidden` 时上报。仅刷新而不停留，控制台里会暂时看不到 CLS/INP 及部分 idle 延迟指标。

### 各指标大致何时出现在控制台？

| 指标 | 何时上报 | 演示建议 |
|------|----------|----------|
| `nav.*`、`network.info`、`storage.estimate` | 页面加载后数秒内（idle 回调后） | 刷新后**停留 3～5 秒**再看性能页 |
| `TTFB`、`FCP` | 首次绘制前后（idle 后批量上报） | 同上 |
| `resource.timing` | 每个资源加载完成 | 刷新后稍等；开发页资源多，会成批出现 |
| `LCP` | 首屏/最大内容绘制更新（SDK 默认 `lcp.reportAllChanges`） | 停留数秒或点「触发 LCP 更新」 |
| `CLS` | 布局偏移；**hidden 时**上报 | 点「触发 CLS」后**切 Tab** 约 2s |
| `INP` | 需先有**用户交互**；**hidden 时**上报会话最慢交互 | 点「慢交互」或任意按钮后**切 Tab** |
| `TBT`、`data.*` | 需先有 **FID**（至少点击一次），再约 **10s** | 刷新后先点页面，再等 10s |
| `http.client` | 慢 fetch 超过阈值 | 演示页「慢 Fetch」按钮 |

### 刷新会丢数据吗？

会。perfume 在页面卸载时若指标尚在 idle 队列、或 SDK 缓冲未发出，**刷新会中断上报**。SDK 已在 `pagehide` / `visibilitychange` 时通过批量合并 + `sendBeacon` 尽力 flush；仍建议：

- 采集 Web Vitals：**加载后停留几秒**，用**切 Tab** 结束会话，而不是连续刷新；
- 查看控制台：将时间范围设为「最近 1 小时」，确认未误筛 `metric`。

示例演示路径：`examples/vanilla` → http://localhost:5174/perf
