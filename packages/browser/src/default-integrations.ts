import { dedupeIntegration, type Integration } from '@sentry-guardian/core';
import {
  breadcrumbsIntegration,
  browserApiErrorsIntegration,
  globalHandlersIntegration,
  httpContextIntegration,
  inboundFiltersIntegration,
  linkedErrorsIntegration,
  type InboundFiltersOptions,
} from './integrations/index.js';

/**
 * Options for {@link getDefaultIntegrations}.
 * {@link getDefaultIntegrations} 的配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: DefaultIntegrationsOptions = {
 *   denyUrls: [/extensions\//],
 *   integrations: [],
 * };
 * ```
 */
export interface DefaultIntegrationsOptions extends InboundFiltersOptions {
  /** Custom integrations merged after defaults (same `name` replaces default). 默认集成之后合并的自定义集成（同名覆盖默认项）。 */
  integrations?: Integration[];
}

/**
 * Default browser integrations (P0).
 * 浏览器默认集成（P0）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getDefaultIntegrations({ denyUrls: [/chrome-extension/] }).map((i) => i.name)
 * // Output / 输出
 * ['InboundFilters', 'Dedupe', 'GlobalHandlers', ...]
 * ```
 */
export function getDefaultIntegrations(options: DefaultIntegrationsOptions = {}): Integration[] {
  const custom = options.integrations ?? [];
  const defaults: Integration[] = [
    inboundFiltersIntegration({
      denyUrls: options.denyUrls,
      allowUrls: options.allowUrls,
    }),
    dedupeIntegration(),
    globalHandlersIntegration(),
    httpContextIntegration(),
    linkedErrorsIntegration(),
    breadcrumbsIntegration(),
    browserApiErrorsIntegration(),
  ];

  const names = new Set(custom.map((i) => i.name));
  return [...defaults.filter((i) => !names.has(i.name)), ...custom];
}
