/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly CLUSTIL_NAME: string;
  readonly CLUSTIL_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
