/**
 * @packageDocumentation
 * SentryGuardian browser SDK.
 * SentryGuardian 浏览器 SDK。
 */

export * from './sdk.js';
export { BrowserClient, type BrowserClientOptions } from './client.js';
export * from './integrations/index.js';
export {
  clear,
  end,
  markNTBT,
  markStep,
  markStepOnce,
  start,
  trackUJNavigation,
} from 'perfume.js';
export { FetchTransport } from './transports/fetch.js';
export { parseStack } from './stack-parser.js';
export { getDefaultIntegrations, type DefaultIntegrationsOptions } from './default-integrations.js';
export {
  dedupeIntegration,
  BufferTransport,
  MockTransport,
  type Integration,
  type Transport,
} from '@sentry-guardian/core';
