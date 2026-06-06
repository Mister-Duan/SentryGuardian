/**
 * Interactive demos for browser SDK performance integrations (perfume.js).
 * 浏览器 SDK 性能集成可交互演示（基于 perfume.js）。
 *
 * Copy in panel descriptions reflects perfume.js `reportPerf` behavior:
 * - CLS / INP: synchronous `analyticsTracker` on page hidden
 * - Other metrics: deferred via `requestIdleCallback` (may be dropped if hidden before idle)
 * - SDK: `lcp.reportAllChanges`, immediate flush for vitals, ~400ms batch for resource.timing
 *
 * @typedef {Object} PerformanceDemo
 * @property {string} id Stable demo id / 稳定演示 ID
 * @property {string} label Button label (zh) / 按钮文案
 * @property {string} mechanism Transaction or metric hint / 事务或指标提示
 * @property {string} description What happens / 行为说明（含 perfume 触发与上报时机）
 * @property {() => void | Promise<void>} run Trigger action / 触发动作
 *
 * @typedef {Object} PerformanceDemoGroup
 * @property {string} title Section title / 分组标题
 * @property {string} [description] Section hint / 分组说明
 * @property {PerformanceDemo[]} items Demo buttons / 演示按钮列表
 */

/** Shared note on perfume → SDK pipeline. perfume → SDK 链路说明。 */
const PERFUME_PIPELINE_NOTE =
  'perfume：多数指标经 requestIdleCallback 才进 analyticsTracker；CLS/INP 在页面 hidden 时同步回调。SDK：LCP 默认 reportAllChanges（可见时也会上报），Vitals 立即 POST，resource.timing 约 400ms 批量。';

/**
 * Build grouped performance demos for an initialized browser SDK.
 * 构建绑定已初始化 SDK 的分组性能演示。
 *
 * @param {typeof import('@sentry-guardian/browser')} sdk Browser SDK namespace / 浏览器 SDK 命名空间
 * @returns {PerformanceDemoGroup[]}
 */
export function buildPerformanceDemoGroups(sdk) {
  return [
    {
      title: 'Web Vitals',
      description: PERFUME_PIPELINE_NOTE,
      items: [
        {
          id: 'vitals-reload',
          label: '刷新页面',
          mechanism: 'TTFB · FCP · nav.* · network.info · storage.estimate',
          description:
            'perfume：initPerfume 时读 navigation/network/storage；web-vitals 注册 TTFB/FCP 等。均经 idle 回调进 analyticsTracker。刷新后停留 3～5s；nav.* 仅上报 >0 字段（本地常只剩 nav.fetch）',
          run: () => {
            window.location.reload();
          },
        },
        {
          id: 'vitals-visibility',
          label: '切 Tab（CLS / INP）',
          mechanism: 'CLS · INP',
          description:
            'perfume：CLS/INP 在 document.hidden 时同步进入 analyticsTracker（不经 idle）。需先有布局偏移（CLS）或用户交互（INP），再切到其他 Tab 约 2s',
          run: () => {
            showPerfHint(
              '先点「触发 CLS」或「慢交互」，再切换到其他 Tab 约 2 秒。CLS/INP 由 perfume 在 hidden 时同步回调。',
            );
          },
        },
        {
          id: 'vitals-lcp',
          label: '触发 LCP 更新(没有触发)',
          mechanism: 'LCP',
          description:
            'perfume：web-vitals 检测更大 LCP 候选。SDK 默认 lcp.reportAllChanges，可见时每次更新即上报；插入大块后停留数秒即可在控制台看到',
          run: () => {
            triggerLcpDemo();
            showPerfHint('已插入 LCP 区块；停留数秒或在 Network 查看 envelope，无需切 Tab。');
          },
        },
        {
          id: 'vitals-cls',
          label: '触发 CLS',
          mechanism: 'CLS',
          description:
            'perfume：无用户输入的布局偏移累加；页面 hidden 时同步回调 analyticsTracker。点本按钮后请切 Tab',
          run: () => {
            triggerClsDemo();
            showPerfHint('已插入横幅；请切到其他 Tab 约 2 秒以触发 perfume CLS 上报。');
          },
        },
        {
          id: 'vitals-fid',
          label: '首次点击（FID）',
          mechanism: 'FID',
          description:
            'perfume：首次 pointer/key 输入触发 web-vitals FID；经 idle 后进 analyticsTracker，每会话一次',
          run: () => {
            showPerfHint('请在 3 秒内点击页面任意位置。');
            window.setTimeout(() => {
              document.body.style.cursor = 'pointer';
              const once = () => {
                document.body.style.cursor = '';
                document.removeEventListener('click', once, true);
              };
              document.addEventListener('click', once, true);
            }, 100);
          },
        },
        {
          id: 'vitals-inp',
          label: '慢交互（INP）(没有触发)',
          mechanism: 'INP',
          description:
            'perfume：需先有交互；取会话最慢交互延迟，hidden 时同步回调。点击下方后切 Tab；无点击则不会有 INP',
          run: () => {
            showPerfHint('点击本提示区域将执行 ~120ms 阻塞，然后切 Tab 约 2s。');
            const handler = (ev) => {
              if (ev.target?.closest?.('#sg-perf-hint')) {
                document.removeEventListener('click', handler, true);
                busyBlock(120);
              }
            };
            document.addEventListener('click', handler, true);
          },
        },
        {
          id: 'vitals-tbt',
          label: '长任务（TBT）',
          mechanism: 'TBT',
          description:
            'perfume：FCP 后累加 longtask；在首次 FID 之后约 10s 且页面仍可见（未 hidden）时上报。请先点击页面一次，再点本按钮并等待 ~10s',
          run: async () => {
            showPerfHint('请先点击页面产生 FID，再等待本演示长任务结束，约 10s 后查看 TBT。');
            await delay(300);
            for (let i = 0; i < 3; i++) {
              busyBlock(60);
              await delay(50);
            }
          },
        },
      ],
    },
    {
      title: '阻塞与重定向',
      description: 'NTBT 需手动 markNTBT；RT 在 initPerfume 时根据 Navigation Timing 判断。',
      items: [
        {
          id: 'perfume-ntbt',
          label: 'markNTBT',
          mechanism: 'NTBT',
          description:
            'perfume：调用 markNTBT() 起 2s 窗口，累加其间 longtask；经 idle 进 analyticsTracker。SPA 路由 listen 中应配合调用',
          run: async () => {
            sdk.markNTBT?.();
            showPerfHint('已 markNTBT；2s 内注入长任务，idle 后上报 NTBT。');
            await delay(100);
            busyBlock(80);
          },
        },
        {
          id: 'perfume-rt',
          label: '经重定向加载（RT）',
          mechanism: 'RT · nav.redirect',
          description:
            'perfume：initPerfume 时若 navigation.redirectTime>0 上报 RT，并拆入 nav.redirect；经 /mock/redirect 302 回 /perf',
          run: () => {
            window.location.href = '/mock/redirect';
          },
        },
      ],
    },
    {
      title: '元素计时',
      description: '需 elementTiming:true（默认已开）且浏览器支持 Element Timing API。',
      items: [
        {
          id: 'perfume-et',
          label: '插入 elementtiming 元素',
          mechanism: 'ET.demoHero',
          description:
            'perfume：PerformanceObserver 捕获 element；metricName ET，attribution.identifier=demoHero。经 idle 后进 analyticsTracker',
          run: () => {
            triggerElementTimingDemo();
            showPerfHint('已插入 elementtiming 元素；停留数秒等待 idle 回调。');
          },
        },
      ],
    },
    {
      title: '资源与流量',
      description: 'resourceTiming 每条资源一条；dataConsumption 与 TBT 相同，在 FID 后约 10s 且页面仍可见时汇总。',
      items: [
        {
          id: 'perfume-resource',
          label: '动态加载脚本',
          mechanism: 'resource.timing',
          description:
            'perfume：resourceTiming:true 时每个资源加载完成触发；经 idle 回调。SDK 将多条 resource.timing 约 400ms 合并为一个 envelope',
          run: async () => {
            await loadMockAsset(`/mock/asset.js?t=${Date.now()}`);
            showPerfHint('脚本已加载；约 0.5s 内在 Network 查看 envelope。');
          },
        },
        {
          id: 'perfume-data-consumption',
          label: '拉取资源（data.*）',
          mechanism: 'data.script · data.total · …',
          description:
            'perfume：FID 后 10s 且页面未 hidden 时，按资源类型汇总 KB（data.beacon/css/script/…）。请先点击页面产生 FID',
          run: async () => {
            showPerfHint('将加载资源；请先点击页面一次，约 10s 且保持本 Tab 可见后查看 data.*。');
            await Promise.all([
              loadMockAsset(`/mock/asset.js?batch=${Date.now()}`),
              fetch('/mock/slow?delay=150').then((r) => r.json()),
            ]);
          },
        },
      ],
    },
    {
      title: '用户旅程与自定义计时',
      description: 'markStep 需 initPerfume({ steps })；start/end 为 User Timing，受 maxMeasureTime（默认 30s）限制。',
      items: [
        {
          id: 'perfume-uj-step',
          label: '用户旅程 markStep',
          mechanism: 'userJourneyStep',
          description:
            'perfume：steps 配置起止 mark 后，连续 markStep 完成一步；metricName userJourneyStep，data 为步骤耗时（ms）',
          run: async () => {
            sdk.markStep?.('demo_checkout_start');
            await delay(80);
            sdk.markStep?.('demo_checkout_end');
            showPerfHint('已 markStep 起止；idle 后上报 userJourneyStep。');
          },
        },
        {
          id: 'perfume-uj-nav',
          label: 'trackUJNavigation',
          mechanism: '（不单独上报事务）',
          description:
            'perfume：SPA 路由变化时调用，清除未完成的 stale step，避免错误 userJourneyStep；本身不产生指标',
          run: () => {
            sdk.trackUJNavigation?.();
            showPerfHint('已 trackUJNavigation；实际 SPA 应在 router.listen 中调用。');
          },
        },
        {
          id: 'perfume-measure',
          label: 'start / end 自定义',
          mechanism: 'perf.measure.demo-task',
          description:
            'perfume：start(name)→end(name) 测 User Timing；metricName 为 name，经 idle 回调。耗时须在 maxMeasureTime 内',
          run: () => {
            sdk.start?.('demo-task');
            busyBlock(50);
            sdk.end?.('demo-task');
            showPerfHint('已 start/end demo-task；idle 后上报 perf.measure.demo-task。');
          },
        },
      ],
    },
    {
      title: '慢请求（非 perfume）',
      description: 'browserTracingIntegration 包装 fetch；与 perfume 无关，按墙钟耗时阈值上报 http.client。',
      items: [
        {
          id: 'slow-fetch-800',
          label: '慢 Fetch ~800ms',
          mechanism: 'http.client',
          description: 'SDK：fetch 耗时 > slowThresholdMs（示例 300ms）即 captureTransaction，无 metric 字段',
          run: async () => {
            const res = await fetch('/mock/slow?delay=800');
            await res.json();
          },
        },
        {
          id: 'slow-fetch-2000',
          label: '慢 Fetch ~2s',
          mechanism: 'http.client',
          description: '同上，延迟 2000ms',
          run: async () => {
            const res = await fetch('/mock/slow?delay=2000');
            await res.json();
          },
        },
        {
          id: 'fast-fetch',
          label: '快 Fetch（不上报）',
          mechanism: 'http.client',
          description: '低于阈值不生成 http.client 事务',
          run: async () => {
            await fetch('/mock/404');
          },
        },
      ],
    },
  ];
}

function triggerLcpDemo() {
  const el = document.createElement('div');
  el.setAttribute('data-sg-perf-demo', 'lcp');
  el.style.cssText =
    'margin:1rem 0;padding:100rem;background:linear-gradient(135deg,#6c5ce7,#00b894);color:#fff;font-size:2rem;font-weight:700;border-radius:8px';
  el.textContent = `LCP 演示区块 · ${new Date().toLocaleTimeString()}`;
  const anchor = document.getElementById('demo-root');
  if (anchor) {
    anchor.prepend(el);
  } else {
    document.body.appendChild(el);
  }
}

function triggerClsDemo() {
  const el = document.createElement('div');
  el.setAttribute('data-sg-perf-demo', 'cls');
  el.style.cssText =
    'margin:0.5rem 0;padding:1.5rem;background:#e17055;color:#fff;font-weight:600';
  el.textContent = 'CLS 演示：此横幅插入导致布局偏移';
  document.body.insertBefore(el, document.body.firstChild);
}

function triggerElementTimingDemo() {
  const existing = document.querySelector('[data-sg-perf-demo="et"]');
  if (existing) {
    existing.remove();
  }
  const el = document.createElement('h2');
  el.setAttribute('data-sg-perf-demo', 'et');
  el.setAttribute('elementtiming', 'demoHero');
  el.style.cssText =
    'margin:1rem 0;padding:1rem 2rem;background:#0984e3;color:#fff;font-size:1.5rem;border-radius:6px';
  el.textContent = `Element Timing 演示 · ${new Date().toLocaleTimeString()}`;
  const anchor = document.getElementById('demo-root');
  if (anchor) {
    anchor.prepend(el);
  } else {
    document.body.prepend(el);
  }
}

/**
 * @param {string} src
 */
function loadMockAsset(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(undefined);
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * @param {number} ms
 */
function busyBlock(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* demo long task */
  }
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * @param {string} message
 */
function showPerfHint(message) {
  const id = 'sg-perf-hint';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('p');
    el.id = id;
    el.className = 'perf-hint';
    el.style.cssText =
      'margin:0.5rem 0;padding:0.5rem 0.75rem;background:#dfe6e9;border-left:3px solid #0984e3;font-size:0.85rem;color:#2d3436';
    const anchor = document.getElementById('demo-root');
    (anchor ?? document.body).prepend(el);
  }
  el.textContent = message;
}
