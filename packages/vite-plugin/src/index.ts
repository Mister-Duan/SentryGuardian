import type { Plugin } from 'vite';
import { uploadArtifactsFromDir, type UploadArtifactsOptions } from './upload-artifacts.js';

/**
 * Vite plugin options for SentryGuardian Source Map upload.
 * SentryGuardian Source Map 上传 Vite 插件选项。
 */
export interface SentryGuardianVitePluginOptions {
  /** Project id. 项目 ID。 */
  projectId: string;
  /** Release version or factory. Release 版本或工厂函数。 */
  release: string | (() => string);
  /** JWT auth token. JWT 认证 token。 */
  authToken: string;
  /** Monitor API URL. Monitor API 地址。 */
  monitorUrl?: string;
  /** CDN URL prefix for bundle_url metadata. bundle_url 的 CDN 前缀。 */
  urlPrefix?: string;
  /** Output directory override (default: vite build outDir). 输出目录覆盖。 */
  outDir?: string;
  /** Log only, no upload. 仅日志不上传。 */
  dryRun?: boolean;
}

/**
 * Vite plugin: upload Source Maps after production build.
 * Vite 插件：生产构建后上传 Source Map。
 *
 * @example
 * ```ts
 * // Input / 输入
 * sentryGuardianVitePlugin({
 *   projectId: 'proj_1',
 *   release: 'app@1.0.0',
 *   authToken: process.env.SG_TOKEN!,
 * })
 * ```
 */
export function sentryGuardianVitePlugin(
  options: SentryGuardianVitePluginOptions,
): Plugin {
  return {
    name: 'sentry-guardian-vite-plugin',
    apply: 'build',
    async closeBundle() {
      const release =
        typeof options.release === 'function' ? options.release() : options.release;
      const outDir = options.outDir ?? 'dist';
      const uploadOptions: UploadArtifactsOptions = {
        monitorUrl: options.monitorUrl ?? 'http://localhost:3002',
        projectId: options.projectId,
        authToken: options.authToken,
        release,
        dir: outDir,
        urlPrefix: options.urlPrefix,
        dryRun: options.dryRun,
      };
      await uploadArtifactsFromDir(uploadOptions);
    },
  };
}

export { uploadArtifactsFromDir, type UploadArtifactsOptions, type UploadArtifactResult } from './upload-artifacts.js';
