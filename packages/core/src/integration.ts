import type { Client } from './client.js';

/**
 * SDK integration plugin interface.
 * SDK 集成插件接口。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const integration: Integration = {
 *   name: 'MyIntegration',
 *   setupOnce: () => {},
 *   setup: (client) => client.addBeforeSend((e) => e),
 * };
 * ```
 */
export interface Integration {
  /** Unique integration name; duplicates in the list are deduped by name. 唯一集成名；列表中同名项会去重。 */
  name: string;
  /** Run once per process before any client setup (global hooks). 每个进程仅运行一次的全局钩子（任意 Client 之前）。 */
  setupOnce?: () => void;
  /** Run per client instance to register handlers or beforeSend. 每个 Client 实例上注册处理器或 beforeSend。 */
  setup?: (client: Client) => void;
}

const registry = new Map<string, Integration>();

/**
 * Register an integration globally (optional extension point).
 * 全局注册集成（可选扩展点）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * registerIntegration({ name: 'MyIntegration', setup: () => {} })
 * // Output / 输出
 * undefined
 * ```
 */
export function registerIntegration(integration: Integration): void {
  registry.set(integration.name, integration);
}

/**
 * Get a registered integration by name.
 * 按名称获取已注册集成。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getIntegration('Dedupe')
 * // Output / 输出
 * { name: 'Dedupe', ... } | undefined
 * ```
 */
export function getIntegration(name: string): Integration | undefined {
  return registry.get(name);
}

/**
 * Run setupOnce/setup for each integration on a client.
 * 在 Client 上初始化各集成的 setupOnce/setup。
 *
 * @example
 * ```ts
 * // Input / 输入
 * setupIntegrations(client, [dedupeIntegration()])
 * // Output / 输出
 * undefined
 * ```
 */
export function setupIntegrations(client: Client, integrations: Integration[]): void {
  for (const integration of integrations) {
    integration.setupOnce?.();
    integration.setup?.(client);
  }
}
