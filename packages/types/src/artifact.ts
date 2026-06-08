/**
 * Artifact type for release uploads.
 * Release 上传制品类型。
 */
export type ArtifactType = 'map' | 'source';

/**
 * Optional metadata when uploading a release artifact.
 * 上传 Release 制品时的可选元数据。
 */
export interface UploadArtifactMetadata {
  /** Normalized bundle URL (no query/hash). 规范化后的 bundle URL（无 query/hash）。 */
  bundle_url?: string;
  /** Debug identifier embedded in the bundle. Bundle 内嵌的 debug 标识。 */
  debug_id?: string;
  /** Artifact kind: source map or raw source file. 制品类型：Source Map 或源文件。 */
  artifact_type?: ArtifactType;
}

/**
 * Release artifact row for console API.
 * 控制台 Release 制品行。
 */
export interface ArtifactResponse {
  /** Artifact id. 制品 ID。 */
  id: string;
  /** Stored filename (e.g. `app.js.map`). 存储文件名。 */
  name: string;
  /** Normalized bundle URL when known. 已知时的 bundle URL。 */
  bundle_url?: string;
  /** Debug id when known. 已知时的 debug id。 */
  debug_id?: string;
  /** Artifact kind. 制品类型。 */
  artifact_type: ArtifactType;
  /** ISO upload time. ISO 上传时间。 */
  created_at: string;
}
