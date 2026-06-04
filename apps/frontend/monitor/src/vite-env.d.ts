/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Monitor API base URL (empty = same origin / Vite proxy). Monitor API 根地址。 */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
