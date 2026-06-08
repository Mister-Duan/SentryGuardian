import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const browserDist = path.join(repoRoot, 'packages/browser/dist');
const vueDist = path.join(repoRoot, 'packages/vue/dist');

/**
 * Vite resolve aliases for workspace SDK packages.
 * `examples/shared/*` sits outside each example's `node_modules`; aliases point at built SDK dist.
 * 为 workspace SDK 提供 Vite 别名；`examples/shared` 不在示例包 node_modules 解析路径内，需指向已构建的 dist。
 *
 * @param {{ vue?: boolean }} [options] When true, include `@sentry-guardian/vue`. 为 true 时包含 vue 包别名。
 * @returns {Record<string, string>}
 *
 * @example
 * ```js
 * // Input / 输入
 * import { sdkWorkspaceAliases, sdkWorkspaceFsAllow } from '../shared/vite-sdk-alias.js';
 * export default defineConfig({
 *   resolve: { alias: sdkWorkspaceAliases() },
 *   server: { fs: { allow: sdkWorkspaceFsAllow() } },
 * });
 * ```
 */
export function sdkWorkspaceAliases(options = {}) {
  const aliases = {
    '@sentry-guardian/browser/performance': path.join(browserDist, 'performance.js'),
    '@sentry-guardian/browser/tracing': path.join(browserDist, 'tracing.js'),
    '@sentry-guardian/browser': path.join(browserDist, 'index.js'),
  };
  if (options.vue) {
    aliases['@sentry-guardian/vue'] = path.join(vueDist, 'index.js');
  }
  return aliases;
}

/** Allow Vite dev server to read monorepo SDK dist outside the example root. 允许 Vite 读取示例目录外的 SDK dist。 */
export function sdkWorkspaceFsAllow() {
  return [repoRoot];
}
