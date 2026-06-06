/**
 * Interactive demos for every default browser SDK error capture path.
 * 浏览器 SDK 默认错误采集路径的可交互演示。
 *
 * @typedef {Object} ErrorDemo
 * @property {string} id Stable demo id / 稳定演示 ID
 * @property {string} label Button label (zh) / 按钮文案
 * @property {string} mechanism SDK mechanism or tag hint / 机制或标签提示
 * @property {string} description What happens / 行为说明
 * @property {() => void | Promise<void>} run Trigger action / 触发动作
 *
 * @typedef {Object} ErrorDemoGroup
 * @property {string} title Section title / 分组标题
 * @property {string} [description] Section hint / 分组说明
 * @property {ErrorDemo[]} items Demo buttons / 演示按钮列表
 */

const BAD_ASSET = 'https://invalid.sentry-guardian.example/missing-asset';

/**
 * Build grouped error demos bound to an initialized browser SDK module.
 * 构建绑定已初始化 browser SDK 的分组错误演示。
 *
 * @param {typeof import('@sentry-guardian/browser')} sdk Browser SDK namespace / 浏览器 SDK 命名空间
 * @returns {ErrorDemoGroup[]}
 *
 * @example
 * ```js
 * // Input / 输入
 * buildErrorDemoGroups(Sentry).map((g) => g.title)
 * // Output / 输出
 * ['JavaScript 运行时', 'Promise', ...]
 * ```
 */
export function buildErrorDemoGroups(sdk) {
  return [
    {
      title: 'JavaScript 运行时',
      description: 'GlobalHandlers · mechanism: onerror',
      items: [
        {
          id: 'throw-error',
          label: 'throw Error',
          mechanism: 'onerror',
          description: '同步 throw，由 window error 捕获',
          run: () => {
            throw new Error('[demo] Vanilla throw Error');
          },
        },
        {
          id: 'type-error',
          label: 'TypeError',
          mechanism: 'onerror',
          description: '访问 null 属性触发 TypeError',
          run: () => {
            const value = null;
            // intentional demo
            value.missing();
          },
        },
        {
          id: 'reference-error',
          label: 'ReferenceError',
          mechanism: 'onerror',
          description: '引用未声明变量',
          run: () => {
            // intentional demo — ReferenceError
            void notDeclaredVariable;
          },
        },
        {
          id: 'linked-errors',
          label: 'Error.cause 链',
          mechanism: 'onerror · LinkedErrors',
          description: '外层 Error 携带 cause 链',
          run: () => {
            const root = new Error('[demo] root cause');
            throw new Error('[demo] wrapped error', { cause: root });
          },
        },
      ],
    },
    {
      title: 'Promise',
      description: 'GlobalHandlers · mechanism: onunhandledrejection',
      items: [
        {
          id: 'unhandled-rejection',
          label: '未处理的 Promise 拒绝',
          mechanism: 'onunhandledrejection',
          description: 'Promise.reject 且未 catch',
          run: () => {
            void Promise.reject(new Error('[demo] unhandled rejection'));
          },
        },
        {
          id: 'unhandled-string',
          label: '拒绝非 Error 值',
          mechanism: 'onunhandledrejection',
          description: 'reject 字符串',
          run: () => {
            void Promise.reject('[demo] rejected string');
          },
        },
      ],
    },
    {
      title: '资源加载失败',
      description: 'BrowserApiErrors · error.type: resource',
      items: [
        {
          id: 'resource-script',
          label: 'script 404',
          mechanism: 'onerror · resource',
          description: '动态插入失败的外部 script',
          run: () => appendResource('script', { src: `${BAD_ASSET}.js` }),
        },
        {
          id: 'resource-img',
          label: 'img 404',
          mechanism: 'onerror · resource',
          description: '加载失败图片',
          run: () => appendResource('img', { src: `${BAD_ASSET}.png` }),
        },
        {
          id: 'resource-link',
          label: 'link 404',
          mechanism: 'onerror · resource',
          description: '样式表加载失败',
          run: () =>
            appendResource('link', {
              rel: 'stylesheet',
              href: `${BAD_ASSET}.css`,
            }),
        },
        {
          id: 'resource-iframe',
          label: 'iframe 404',
          mechanism: 'onerror · resource',
          description: 'iframe 目标不可达',
          run: () => appendResource('iframe', { src: `${BAD_ASSET}.html` }),
        },
        {
          id: 'resource-video',
          label: 'video 404',
          mechanism: 'onerror · resource',
          description: 'video 媒体加载失败',
          run: () => {
            const video = appendResource('video', { src: `${BAD_ASSET}.mp4` });
            const source = document.createElement('source');
            source.src = `${BAD_ASSET}.webm`;
            video.appendChild(source);
          },
        },
        {
          id: 'resource-audio',
          label: 'audio 404',
          mechanism: 'onerror · resource',
          description: 'audio 媒体加载失败',
          run: () => appendResource('audio', { src: `${BAD_ASSET}.mp3` }),
        },
      ],
    },
    {
      title: 'HTTP 请求失败',
      description: 'HttpErrors · fetch / XHR',
      items: [
        {
          id: 'fetch-500',
          label: 'Fetch HTTP 500',
          mechanism: 'http.client',
          description: 'GET /mock/500（本地 Vite 中间件）',
          run: async () => {
            await fetch('/mock/500');
          },
        },
        {
          id: 'fetch-404',
          label: 'Fetch HTTP 404',
          mechanism: 'http.client',
          description: 'GET /mock/404',
          run: async () => {
            await fetch('/mock/404');
          },
        },
        {
          id: 'fetch-network',
          label: 'Fetch 网络错误',
          mechanism: 'http.client',
          description: '连接被拒绝的端口',
          run: async () => {
            await fetch('http://127.0.0.1:9/sg-network-fail');
          },
        },
        {
          id: 'xhr-500',
          label: 'XHR HTTP 500',
          mechanism: 'xhr',
          description: 'XMLHttpRequest /mock/500',
          run: () => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/mock/500');
            xhr.send();
          },
        },
        {
          id: 'xhr-404',
          label: 'XHR HTTP 404',
          mechanism: 'xhr',
          description: 'XMLHttpRequest /mock/404',
          run: () => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/mock/404');
            xhr.send();
          },
        },
      ],
    },
    {
      title: 'Console',
      description: 'CaptureConsole · mechanism: console',
      items: [
        {
          id: 'console-error',
          label: 'console.error',
          mechanism: 'console',
          description: '同时产生面包屑与错误事件',
          run: () => {
            console.error('[demo] console.error', { detail: 'from example' });
          },
        },
        {
          id: 'console-warn',
          label: 'console.warn',
          mechanism: 'console · warning',
          description: '若集成 levels 含 warn 则上报',
          run: () => {
            console.warn('[demo] console.warn');
          },
        },
      ],
    },
    {
      title: '手动 API',
      description: 'captureException / captureMessage',
      items: [
        {
          id: 'capture-exception',
          label: 'captureException',
          mechanism: 'generic',
          description: '业务代码主动上报异常',
          run: () => {
            sdk.captureException(new Error('[demo] manual captureException'));
          },
        },
        {
          id: 'capture-message',
          label: 'captureMessage',
          mechanism: 'generic · message',
          description: '无堆栈的消息事件',
          run: () => {
            sdk.captureMessage('[demo] manual captureMessage', 'warning');
          },
        },
      ],
    },
    {
      title: 'CSP 违规',
      description: 'CspErrors · mechanism: onsecuritypolicyviolation',
      items: [
        {
          id: 'csp-img',
          label: 'CSP 违规（图片）',
          mechanism: 'onsecuritypolicyviolation',
          description: '动态 img-src 策略后加载外部图片（当前页 SDK 上报）',
          run: () => {
            if (!document.querySelector('meta[data-sg-csp-demo]')) {
              const meta = document.createElement('meta');
              meta.httpEquiv = 'Content-Security-Policy';
              meta.content = "img-src 'self'";
              meta.setAttribute('data-sg-csp-demo', '1');
              document.head.appendChild(meta);
            }
            const img = document.createElement('img');
            img.src = 'https://example.com/sg-csp-demo.png';
            img.style.display = 'none';
            img.setAttribute('data-sg-csp-demo', '1');
            document.body.appendChild(img);
          },
        },
        {
          id: 'csp-open-lab',
          label: '打开 CSP 实验页',
          mechanism: 'onsecuritypolicyviolation',
          description: '独立页 /csp-lab.html（含 script / eval 场景）',
          run: () => {
            window.open('/csp-lab.html', '_blank', 'noopener');
          },
        },
      ],
    },
  ];
}

/**
 * @param {string} tag
 * @param {Record<string, string>} attrs
 * @returns {HTMLElement}
 */
function appendResource(tag, attrs) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'src' && 'src' in el) {
      /** @type {HTMLImageElement & HTMLScriptElement} */ (el).src = value;
    } else if (key === 'href' && 'href' in el) {
      /** @type {HTMLLinkElement} */ (el).href = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  el.setAttribute('data-sg-demo-resource', '1');
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}
