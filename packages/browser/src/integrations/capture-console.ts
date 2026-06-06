import type { Client, Integration } from '@sentry-guardian/core';
import type { EventLevel } from '@sentry-guardian/types';

export type CaptureConsoleOptions = {
  /** Console levels that also emit error events (default `['error']`). 同时上报为事件的 console 级别。 */
  levels?: Array<'error' | 'warn'>;
};

/**
 * Capture selected `console` levels as error events (in addition to breadcrumbs).
 * 将选定的 `console` 级别捕获为错误事件（面包屑仍由 Breadcrumbs 集成记录）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * captureConsoleIntegration({ levels: ['error', 'warn'] }).name
 * // Output / 输出
 * 'CaptureConsole'
 * ```
 */
type CaptureLevel = 'error' | 'warn';

export function captureConsoleIntegration(options?: CaptureConsoleOptions): Integration {
  const levels: CaptureLevel[] = options?.levels ?? ['error'];

  return {
    name: 'CaptureConsole',
    setup(client: Client) {
      if (typeof window === 'undefined') {
        return;
      }

      for (const level of levels) {
        const original = console[level].bind(console) as (...args: unknown[]) => void;
        console[level] = (...args: unknown[]) => {
          const message = args.map(String).join(' ');
          const eventLevel: EventLevel = level === 'warn' ? 'warning' : 'error';
          client.captureException(message, {
            mechanism: 'console',
            level: eventLevel,
            tags: { 'error.type': 'console', 'console.level': level },
          });
          original.apply(console, args);
        };
      }
    },
  };
}
