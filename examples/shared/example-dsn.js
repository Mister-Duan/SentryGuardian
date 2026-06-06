/**
 * Resolve ingest DSN for Vite examples (env or local seed fallback).
 * 解析 Vite 示例的 ingest DSN（环境变量或本地 seed 回退）。
 *
 * @example
 * ```js
 * // Input / 输入
 * resolveExampleDsn(import.meta.env.VITE_DSN)
 * // Output / 输出（示例）
 * 'http://localhost:3001/api/sentry/envelope/...'
 * ```
 */
export function resolveExampleDsn(envDsn) {
  return envDsn || 'http://localhost:3001/api/sentry/envelope/cmpzkjt2d0004hyyc79uh0x89';
}
