/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_CAST_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
