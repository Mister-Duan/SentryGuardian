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
 * Resolve ingest URL scheme for a DSN host (loopback always uses HTTP).
 * 根据 DSN 主机解析上报协议（回环地址强制 HTTP）。
 */
function ingestScheme(host: string, scheme: 'http' | 'https'): 'http' | 'https' {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'http';
  }
  return scheme;
}

/**
 * Parse DSN into ingest URL parts.
 * 解析 DSN 为上报 URL 组成部分。
 *
 * @example
 * ```ts
 * // Input / 输入（本地常见误写 https，仍解析为 http 上报）
 * parseDsn('https://publicKey@localhost:3001/api/my-project')
 * // Output / 输出
 * { publicKey: 'publicKey', projectId: 'my-project', envelopeUrl: 'http://localhost:3001/api/my-project/envelope/' }
 * ```
 */
export function parseDsn(dsn: string): {
  publicKey: string;
  projectId: string;
  envelopeUrl: string;
} {
  const match = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/api\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid DSN: ${dsn}`);
  }
  const [, scheme, publicKey, host, projectId] = match;
  const resolvedScheme = ingestScheme(host, scheme as 'http' | 'https');
  return {
    publicKey: publicKey!,
    projectId: projectId!,
    envelopeUrl: `${resolvedScheme}://${host}/api/${projectId}/envelope/`,
  };
}
