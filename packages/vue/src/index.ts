import type { App } from 'vue';
import { captureException, getClient } from '@sentry-guardian/browser';
import type { Integration } from '@sentry-guardian/core';

/**
 * Attach Vue 3 global error handler to the active browser client.
 * 将 Vue 3 全局 errorHandler 挂到活跃 browser client。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const app = createApp(App);
 * vueIntegration(app);
 * app.mount('#app');
 * // Output / 输出
 * undefined
 * ```
 */
export function vueIntegration(app: App): void {
  const prior = app.config.errorHandler;
  app.config.errorHandler = (err, instance, info) => {
    captureException(err);
    prior?.(err, instance, info);
  };
}

/**
 * Integration wrapper for {@link vueIntegration}.
 * {@link vueIntegration} 的 Integration 包装。
 */
export function vueIntegrationPlugin(app: App): Integration {
  return {
    name: 'Vue',
    setup() {
      vueIntegration(app);
    },
  };
}

/**
 * Record vue-router navigation as breadcrumbs.
 * 将 vue-router 导航记录为面包屑。
 */
export function vueRouterIntegration(router: {
  afterEach: (cb: (to: { fullPath: string }, from: { fullPath: string }) => void) => void;
}): Integration {
  return {
    name: 'VueRouter',
    setup(client) {
      router.afterEach((to, from) => {
        if (!getClient()) {
          return;
        }
        client.getScope().get().addBreadcrumb({
          category: 'navigation',
          message: `${from.fullPath} → ${to.fullPath}`,
          level: 'info',
          timestamp: Date.now() / 1000,
        });
      });
    },
  };
}

export { getClient, init } from '@sentry-guardian/browser';
