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
    },
  };
}
