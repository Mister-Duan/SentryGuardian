/**
 * @packageDocumentation
 * SentryGuardian SDK core (environment-agnostic).
 * SentryGuardian SDK 内核（与环境无关）。
 */

export * from './sdk.js';
export * from './capture-hint.js';
export * from './client.js';
export * from './scope.js';
export * from './integration.js';
export * from './event-processor.js';
export * from './envelope.js';
export * from './dsn.js';
export * from './transports/base.js';
export * from './transports/buffer.js';
export { dedupeIntegration } from './integrations/dedupe.js';
