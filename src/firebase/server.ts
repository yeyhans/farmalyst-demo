import type { ServiceAccount } from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { 
  FIREBASE_PROJECT_ID, 
  FIREBASE_PRIVATE_KEY_ID, 
  FIREBASE_PRIVATE_KEY, 
  FIREBASE_CLIENT_EMAIL, 
  FIREBASE_CLIENT_ID, 
  FIREBASE_AUTH_URI, 
  FIREBASE_TOKEN_URI, 
  FIREBASE_AUTH_CERT_URL, 
  FIREBASE_CLIENT_CERT_URL 
} from 'astro:env/server';

const activeApps = getApps();

const serviceAccount: ServiceAccount = {
  type: "service_account",
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplazo necesario si el formato es JSON
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: FIREBASE_AUTH_URI,
  token_uri: FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: FIREBASE_AUTH_CERT_URL,
  client_x509_cert_url: FIREBASE_CLIENT_CERT_URL,
};

const initApp = () => {
  if (import.meta.env.PROD) {
    console.info('PROD env detected. Using default service account.');
    // Usa la configuración predeterminada en Firebase Functions
    return initializeApp();
  }
  console.info('Loading service account from env.');
  return initializeApp({
    credential: cert(serviceAccount)
  });
}

export const app = activeApps.length === 0 ? initApp() : activeApps[0];
