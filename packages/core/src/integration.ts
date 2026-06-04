import type { Client } from './client.js';

/**
 * SDK integration plugin interface.
 * SDK 集成插件接口。
 */
export interface Integration {
  name: string;
  setupOnce?: () => void;
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
 */
export function setupIntegrations(client: Client, integrations: Integration[]): void {
  for (const integration of integrations) {
    integration.setupOnce?.();
    integration.setup?.(client);
  }
}
