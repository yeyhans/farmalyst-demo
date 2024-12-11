import type { APIRoute } from 'astro';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";
import { TuyaContext } from '@tuya/tuya-connector-nodejs';

const db = getFirestore(app);

// ⚠️ Validación de variables de entorno
if (!import.meta.env.PUBLIC_TUYA_ACCESS_KEY || !import.meta.env.PUBLIC_TUYA_SECRET_KEY) {
  throw new Error('Las variables PUBLIC_TUYA_ACCESS_KEY y PUBLIC_TUYA_SECRET_KEY no están definidas en .env');
}

// Configuración de la instancia Tuya
const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: import.meta.env.PUBLIC_TUYA_ACCESS_KEY,
  secretKey: import.meta.env.PUBLIC_TUYA_SECRET_KEY,
});

export const GET: APIRoute = async ({ cookies, request, url }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie || sessionCookie.trim() === '') {
    return new Response(JSON.stringify({ error: "No se encontró la sesión" }), { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const profileDoc = await db.collection("profiles").doc(userId).get();
    if (!profileDoc.exists) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado para el usuario' }), { status: 404 });
    }

    const profileData = profileDoc.data();
    const device_id = profileData?.device_id;

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'No se encontró un device_id para este usuario' }), { status: 404 });
    }

    // 📝 Parámetros de la consulta de la URL
    const urlParams = new URLSearchParams(url.search);
    const codes = urlParams.get('codes') || 'va_humidity'; // Predeterminado a 'va_humidity'
    const start_time = urlParams.get('start_time');
    const end_time = urlParams.get('end_time');
    const size = urlParams.get('size') || '20';

    // ⚠️ Validación de parámetros
    if (!start_time || !end_time) {
      return new Response(JSON.stringify({ error: 'start_time y end_time son obligatorios' }), { status: 400 });
    }

    // 🔥 Realizar la solicitud a la API de Tuya
    const reportData = await context.request({
      path: `/v2.0/cloud/thing/${device_id}/report-logs`,
      method: 'GET',
      query: {
        codes,
        start_time,
        end_time,
        size,
      },
    });

    if (!reportData.success) {
      return new Response(JSON.stringify({ error: 'Error al obtener los reportes de Tuya' }), { status: 500 });
    }

    const reportResults = reportData.result;
    
    return new Response(JSON.stringify({ data: reportResults }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error al obtener los reportes de Tuya:", error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor', details: error.message }), { status: 500 });
  }
};
