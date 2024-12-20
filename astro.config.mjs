import { defineConfig, envField  } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({

  env: {
    schema: {
      PUBLIC_TUYA_ACCESS_KEY: envField.string({ context: "client", access: "public" }),
      PUBLIC_TUYA_SECRET_KEY: envField.string({ context: "client", access: "public" }),

      OPENAI_API_KEY: envField.string({ context: "server", access: "secret" }),
      FIREBASE_PROJECT_ID: envField.string({ context: "server", access: "secret" }),
      FIREBASE_PRIVATE_KEY_ID: envField.string({ context: "server", access: "secret" }),
      FIREBASE_PRIVATE_KEY: envField.string({ context: "server", access: "secret" }),
      FIREBASE_CLIENT_EMAIL: envField.string({ context: "server", access: "secret" }),
      FIREBASE_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      FIREBASE_AUTH_URI: envField.string({ context: "server", access: "secret" }),
      FIREBASE_TOKEN_URI: envField.string({ context: "server", access: "secret" }),
      FIREBASE_AUTH_CERT_URL: envField.string({ context: "server", access: "secret" }),
      FIREBASE_CLIENT_CERT_URL: envField.string({ context: "server", access: "secret" }),
      FIREBASE_DATABASE_URL: envField.string({ context: "server", access: "secret" }),

      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_KEY: envField.string({ context: "server", access: "secret" }),
      
    }
  },
  // Or 'hybrid' if you also want to pre-render static routes
  output: 'server',
  integrations: [tailwind(), react()]
});