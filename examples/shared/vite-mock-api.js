/**
 * Vite dev middleware: mock HTTP status endpoints for fetch/XHR error demos.
 * Vite 开发中间件：为 fetch/XHR 错误演示提供模拟 HTTP 状态码接口。
 *
 * @example
 * ```js
 * // Input / 输入
 * import { mockHttpErrorsPlugin } from '../shared/vite-mock-api.js';
 * export default defineConfig({ plugins: [mockHttpErrorsPlugin()] });
 * ```
 */
export function mockHttpErrorsPlugin() {
  return {
    name: 'sg-mock-http-errors',
    configureServer(server) {
      server.middlewares.use('/mock/404', (_req, res) => {
        res.statusCode = 404;
        res.end('Not Found');
      });
      server.middlewares.use('/mock/500', (_req, res) => {
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
      server.middlewares.use('/mock/slow', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const delay = Math.min(Math.max(Number(url.searchParams.get('delay') ?? 800) || 800, 50), 5000);
        setTimeout(() => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, delay_ms: delay }));
        }, delay);
      });
      server.middlewares.use('/mock/asset.js', (_req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript');
        res.end('/* SentryGuardian perf demo asset */');
      });
      server.middlewares.use('/mock/redirect', (_req, res) => {
        res.statusCode = 302;
        res.setHeader('Location', '/perf');
        res.end();
      });
    },
  };
}
