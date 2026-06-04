import type { Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

type ConsoleLevel = 'debug' | 'info' | 'warn' | 'error';

const CONSOLE_LEVELS: ConsoleLevel[] = ['debug', 'info', 'warn', 'error'];

/**
 * Record console, navigation, and click breadcrumbs.
 * 记录 console、导航与点击面包屑。
 *
 * @example
 * ```ts
 * // Input / 输入
 * breadcrumbsIntegration().name
 * // Output / 输出
 * 'Breadcrumbs'
 * ```
 */
export function breadcrumbsIntegration(): Integration {
  return {
    name: 'Breadcrumbs',
    setup(client) {
      if (!isBrowser()) {
        return;
      }

      const scope = client.getScope().get();

      for (const level of CONSOLE_LEVELS) {
        const original = console[level] as (...args: unknown[]) => void;
        console[level] = (...args: unknown[]) => {
          scope.addBreadcrumb({
            category: 'console',
            message: args.map(String).join(' '),
            level: level === 'warn' ? 'warning' : level === 'debug' ? 'debug' : level,
            timestamp: Date.now() / 1000,
          });
          original.apply(console, args);
        };
      }

      const addNavigation = (to: string) => {
        scope.addBreadcrumb({
          type: 'navigation',
          category: 'navigation',
          data: { to },
          timestamp: Date.now() / 1000,
        });
      };

      window.addEventListener('popstate', () => {
        addNavigation(window.location.href);
      });

      const pushState = history.pushState.bind(history);
      history.pushState = (...args: Parameters<History['pushState']>) => {
        pushState(...args);
        addNavigation(window.location.href);
      };

      document.addEventListener(
        'click',
        (event) => {
          const target = event.target as HTMLElement | null;
          if (!target) {
            return;
          }
          scope.addBreadcrumb({
            type: 'ui',
            category: 'ui.click',
            message: target.tagName?.toLowerCase(),
            data: {
              tag: target.tagName,
              id: target.id || undefined,
              class: target.className || undefined,
            },
            timestamp: Date.now() / 1000,
          });
        },
        true,
      );
    },
  };
}
