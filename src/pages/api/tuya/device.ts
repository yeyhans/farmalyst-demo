import type { APIRoute } from 'astro';
import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import { 
  PUBLIC_TUYA_ACCESS_KEY,
  PUBLIC_TUYA_SECRET_KEY,
} from 'astro:env/client';

// ⚠️ Verificar que las claves de Tuya estén definidas
if (!PUBLIC_TUYA_ACCESS_KEY || !PUBLIC_TUYA_SECRET_KEY) {
  throw new Error('Las variables PUBLIC_TUYA_ACCESS_KEY y PUBLIC_TUYA_SECRET_KEY no están definidas en .env');
}

const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: PUBLIC_TUYA_ACCESS_KEY,
  secretKey: PUBLIC_TUYA_SECRET_KEY,
});

export const PUT: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json();
    const deviceId = formData.device_id;
    const deviceName = formData.deviceName;

    if (!deviceId || !deviceName) {
      return new Response(JSON.stringify({ error: 'device_id y deviceName son requeridos' }), { status: 400 });
    }

    const response = await context.request({
      path: `/v1.0/iot-03/devices/${deviceId}`,
      method: 'PUT',
      body: {
        name: deviceName,
      },
    });

    if (!response.success) {
      return new Response(JSON.stringify({ error: 'Error al actualizar el nombre del dispositivo en Tuya' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, result: response.result }), { status: 200 });

  } catch (error) {
    console.error("Error al actualizar el nombre del dispositivo en Tuya:", error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor', details: error.message }), { status: 500 });
  }
};
