import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

/**
 * Options for uploading release artifacts to SentryGuardian Monitor API.
 * 向 SentryGuardian Monitor API 上传 Release 制品的配置。
 */
export interface UploadArtifactsOptions {
  /** Monitor API base URL. Monitor API 根 URL。 */
  monitorUrl: string;
  /** Project id. 项目 ID。 */
  projectId: string;
  /** JWT or project token. JWT 或项目 token。 */
  authToken: string;
  /** Release version (must match SDK init). Release 版本（须与 SDK init 一致）。 */
  release: string;
  /** Directory containing build output. 构建输出目录。 */
  dir: string;
  /** CDN URL prefix prepended to bundle file names. CDN URL 前缀。 */
  urlPrefix?: string;
  /** Skip network calls and log only. 跳过网络请求仅打印日志。 */
  dryRun?: boolean;
}

export interface UploadArtifactResult {
  name: string;
  status: 'uploaded' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Parse debug id from source map JSON.
 * 从 Source Map JSON 解析 debug id。
 */
export function parseDebugIdFromMapJson(sourceMapJson: string): string | undefined {
  try {
    const parsed = JSON.parse(sourceMapJson) as Record<string, unknown>;
    const id = parsed.debugId ?? parsed['x_google_debugId'];
    return typeof id === 'string' && id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Derive bundle URL for an artifact from map file name and optional prefix.
 * 根据 map 文件名与可选前缀推导 bundle URL。
 */
export function bundleUrlForMapFile(mapFileName: string, urlPrefix?: string): string | undefined {
  const jsName = mapFileName.endsWith('.map') ? mapFileName.slice(0, -4) : mapFileName;
  if (urlPrefix) {
    return `${urlPrefix.replace(/\/$/, '')}/${jsName.split('/').pop() ?? jsName}`;
  }
  return undefined;
}

async function ensureRelease(options: UploadArtifactsOptions): Promise<string> {
  const res = await fetch(`${options.monitorUrl}/api/projects/${options.projectId}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: options.release }),
  });
  if (!res.ok) {
    throw new Error(`Create release failed: ${res.status}`);
  }
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function uploadOne(
  options: UploadArtifactsOptions,
  releaseId: string,
  name: string,
  content: string,
  metadata: { bundle_url?: string; debug_id?: string },
): Promise<void> {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'application/json' }), name);
  if (metadata.bundle_url) {
    form.append('bundle_url', metadata.bundle_url);
  }
  if (metadata.debug_id) {
    form.append('debug_id', metadata.debug_id);
  }
  form.append('artifact_type', 'map');

  const res = await fetch(
    `${options.monitorUrl}/api/projects/${options.projectId}/releases/${releaseId}/artifacts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${options.authToken}` },
      body: form,
    },
  );
  if (!res.ok) {
    throw new Error(`Upload ${name} failed: ${res.status}`);
  }
}

async function collectMapFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMapFiles(full)));
    } else if (entry.name.endsWith('.map')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Upload all `.map` files under a directory to a SentryGuardian release.
 * 将目录下所有 `.map` 文件上传到 SentryGuardian Release。
 *
 * @example
 * ```ts
 * // Input / 输入
 * await uploadArtifactsFromDir({
 *   monitorUrl: 'http://localhost:3002',
 *   projectId: 'proj_1',
 *   authToken: 'jwt',
 *   release: 'app@1.0.0',
 *   dir: './dist',
 * })
 * // Output / 输出
 * [{ name: 'main.js.map', status: 'uploaded' }]
 * ```
 */
export async function uploadArtifactsFromDir(
  options: UploadArtifactsOptions,
): Promise<UploadArtifactResult[]> {
  const mapPaths = await collectMapFiles(options.dir);
  const results: UploadArtifactResult[] = [];

  if (options.dryRun) {
    for (const path of mapPaths) {
      const name = relative(options.dir, path);
      console.log(`[sentry-guardian] dry-run would upload ${name}`);
      results.push({ name, status: 'skipped' });
    }
    return results;
  }

  const releaseId = await ensureRelease(options);

  for (const path of mapPaths) {
    const name = relative(options.dir, path);
    try {
      const content = await readFile(path, 'utf8');
      const debug_id = parseDebugIdFromMapJson(content);
      const bundle_url = bundleUrlForMapFile(name, options.urlPrefix);
      await uploadOne(options, releaseId, name, content, { bundle_url, debug_id });
      results.push({ name, status: 'uploaded' });
      console.log(`[sentry-guardian] uploaded ${name} checksum=${createHash('sha256').update(content).digest('hex').slice(0, 8)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, status: 'failed', error: message });
      console.error(`[sentry-guardian] failed ${name}: ${message}`);
    }
  }

  return results;
}
