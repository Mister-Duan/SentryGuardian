/**
 * Build ingest DSN for a project.
 * 为项目生成 ingest DSN。
 *
 * @example
 * ```ts
 * // Input / 输入
 * buildDsn('abc123', 'projId', 'localhost:3000')
 * // Output / 输出
 * 'https://abc123@localhost:3000/api/projId'
 * ```
 */
export function buildDsn(publicKey: string, projectId: string, host = 'localhost:3000'): string {
  return `https://${publicKey}@${host}/api/${projectId}`;
}
