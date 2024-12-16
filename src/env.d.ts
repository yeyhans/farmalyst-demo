/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly FIREBASE_PRIVATE_KEY_ID: string;
    readonly FIREBASE_PRIVATE_KEY: string;
    readonly FIREBASE_PROJECT_ID: string;
    readonly FIREBASE_CLIENT_EMAIL: string;
    readonly FIREBASE_CLIENT_ID: string;
    readonly FIREBASE_AUTH_URI: string;
    readonly FIREBASE_TOKEN_URI: string;
    readonly FIREBASE_AUTH_CERT_URL: string
    readonly FIREBASE_CLIENT_CERT_URL: string;

    readonly PUBLIC_TUYA_ACCESS_KEY: string;
    readonly PUBLIC_TUYA_SECRET_KEY: string;

    readonly OPENAI_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }