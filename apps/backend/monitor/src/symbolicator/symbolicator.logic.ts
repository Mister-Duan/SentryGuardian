import type { StackFrame } from '@sentry-guardian/types';

/** Artifact row shape used by symbolicator indexing. Symbolicator 索引使用的制品行。 */
export interface SymbolicatorArtifact {
  name: string;
  sourceMap: string;
  bundleUrl?: string | null;
  debugId?: string | null;
  artifactType?: string | null;
}

/** Indexed artifacts for frame lookup. 用于栈帧查找的制品索引。 */
export interface ArtifactIndex {
  byDebugId: Map<string, SymbolicatorArtifact>;
  byBundleUrl: Map<string, SymbolicatorArtifact>;
  byName: Map<string, SymbolicatorArtifact>;
  maps: SymbolicatorArtifact[];
  sources: Map<string, string>;
}

/**
 * Normalize a bundle URL for lookup (strip query/hash, unify webpack prefix).
 * 规范化 bundle URL 以便查找（去 query/hash，统一 webpack 前缀）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * normalizeBundleUrl('https://cdn.example.com/app.js?v=1#x')
 * // Output / 输出
 * 'https://cdn.example.com/app.js'
 * ```
 */
export function normalizeBundleUrl(url: string): string {
  let value = url.trim();
  value = value.replace(/^webpack:\/\//, '');
  value = value.replace(/^\/+\.\//, './');
  if (value.startsWith('//')) {
    value = `https:${value}`;
  }
  try {
    if (/^https?:\/\//.test(value)) {
      const parsed = new URL(value);
      parsed.search = '';
      parsed.hash = '';
      return parsed.href.replace(/\/$/, '');
    }
  } catch {
    // fall through for non-URL paths
  }
  const noHash = value.split('#')[0] ?? value;
  const noQuery = noHash.split('?')[0] ?? noHash;
  return noQuery.replace(/\/$/, '');
}

/**
 * Derive bundle lookup key from a stack frame filename.
 * 从栈帧 filename 推导 bundle 查找键。
 */
export function bundleUrlFromFrame(filename: string): string {
  const normalized = normalizeBundleUrl(filename);
  if (normalized.endsWith('.map')) {
    return normalized.slice(0, -4);
  }
  return normalized;
}

/**
 * Basename of a path or URL.
 * 路径或 URL 的文件名部分。
 */
export function basename(path: string): string {
  const clean = path.split('?')[0]?.split('#')[0] ?? path;
  const parts = clean.split(/[/\\]/);
  return parts[parts.length - 1] ?? clean;
}

/**
 * Parse debug id from a source map JSON string.
 * 从 Source Map JSON 字符串解析 debug id。
 */
export function parseDebugIdFromMap(sourceMapJson: string): string | undefined {
  try {
    const parsed = JSON.parse(sourceMapJson) as Record<string, unknown>;
    const debugId = parsed.debugId ?? parsed['x_google_debugId'];
    return typeof debugId === 'string' && debugId.length > 0 ? debugId : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build lookup indexes from release artifacts.
 * 根据 Release 制品构建查找索引。
 */
export function buildArtifactIndex(artifacts: SymbolicatorArtifact[]): ArtifactIndex {
  const byDebugId = new Map<string, SymbolicatorArtifact>();
  const byBundleUrl = new Map<string, SymbolicatorArtifact>();
  const byName = new Map<string, SymbolicatorArtifact>();
  const maps: SymbolicatorArtifact[] = [];
  const sources = new Map<string, string>();

  for (const artifact of artifacts) {
    const type = artifact.artifactType ?? 'map';
    if (type === 'source') {
      sources.set(normalizeSourcePath(artifact.name), artifact.sourceMap);
      sources.set(basename(artifact.name), artifact.sourceMap);
      continue;
    }

    maps.push(artifact);
    byName.set(artifact.name, artifact);
    byName.set(basename(artifact.name), artifact);

    if (artifact.debugId) {
      byDebugId.set(artifact.debugId, artifact);
    } else {
      const parsed = parseDebugIdFromMap(artifact.sourceMap);
      if (parsed) {
        byDebugId.set(parsed, artifact);
      }
    }

    if (artifact.bundleUrl) {
      byBundleUrl.set(normalizeBundleUrl(artifact.bundleUrl), artifact);
    }

    const fromName = artifact.name.endsWith('.map')
      ? artifact.name.slice(0, -4)
      : artifact.name;
    byBundleUrl.set(normalizeBundleUrl(fromName), artifact);
    byName.set(`${basename(fromName)}.map`, artifact);
  }

  return { byDebugId, byBundleUrl, byName, maps, sources };
}

/**
 * Resolve the best matching map artifact for a stack frame.
 * 为栈帧解析最匹配的 map 制品。
 */
export function resolveArtifactForFrame(
  frame: StackFrame,
  index: ArtifactIndex,
): SymbolicatorArtifact | undefined {
  const filename = frame.filename ?? '';
  if (!filename) {
    return index.maps.length === 1 ? index.maps[0] : undefined;
  }

  const bundleKey = bundleUrlFromFrame(filename);
  const byUrl = index.byBundleUrl.get(bundleKey);
  if (byUrl) {
    return byUrl;
  }

  const base = basename(filename);
  const mapName = base.endsWith('.map') ? base : `${base}.map`;
  const byName = index.byName.get(mapName) ?? index.byName.get(base);
  if (byName) {
    return byName;
  }

  if (index.maps.length === 1) {
    return index.maps[0];
  }

  return undefined;
}

/**
 * Normalize a source path from a source map `sources` entry.
 * 规范化 Source Map sources 条目路径。
 */
export function normalizeSourcePath(source: string): string {
  return source.replace(/^webpack:\/\//, '').replace(/^\.\//, '');
}

/**
 * Whether a symbolicated path looks like application code.
 * 符号化后的路径是否像应用代码。
 */
export function inferInAppFromPath(filename: string): boolean {
  if (/node_modules/i.test(filename) || /webpack-internal/i.test(filename)) {
    return false;
  }
  return true;
}
