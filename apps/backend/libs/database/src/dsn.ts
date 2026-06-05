/**
 * Build ingest DSN for a project.
 * 为项目生成 ingest DSN。
 *
 * Format / 格式：`{scheme}://{host}/api/sentry/{projectId}`
 *
 * @example
 * ```ts
 * // Input / 输入
 * buildDsn('projId', 'localhost:3000')
 * // Output / 输出
 * 'http://localhost:3000/api/sentry/projId'
 * ```
 */
export function buildDsn(projectId: string, host = 'localhost:3000'): string {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  const scheme =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' ? 'http' : 'https';
  return `${scheme}://${host}/api/sentry/${projectId}`;
}
