/**
 * Generate a random event ID (UUID v4).
 * 生成随机 event_id（UUID v4）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * generateEventId()
 * // Output / 输出（格式示例）
 * 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * ```
 */
export function generateEventId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // cspell:disable-next-line
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Parse DSN into ingest URL parts.
 * 解析 DSN 为上报 URL 组成部分。
 *
 * @example
 * ```ts
 * // Input / 输入
 * parseDsn('https://publicKey@host.example/api/my-project')
 * // Output / 输出
 * { publicKey: 'publicKey', projectId: 'my-project', envelopeUrl: 'https://host.example/api/my-project/envelope/' }
 * ```
 */
export function parseDsn(dsn: string): {
  publicKey: string;
  projectId: string;
  envelopeUrl: string;
} {
  const match = dsn.match(/^https?:\/\/([^@]+)@([^/]+)\/api\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid DSN: ${dsn}`);
  }
  const [, publicKey, host, projectId] = match;
  return {
    publicKey: publicKey!,
    projectId: projectId!,
    envelopeUrl: `https://${host}/api/${projectId}/envelope/`,
  };
}
