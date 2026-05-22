/// <reference types="vite/client" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.webp';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
