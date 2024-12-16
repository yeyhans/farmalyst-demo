import type { APIRoute } from 'astro';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";
import { TuyaContext } from '@tuya/tuya-connector-nodejs';

import { 
  PUBLIC_TUYA_ACCESS_KEY,
  PUBLIC_TUYA_SECRET_KEY,
} from 'astro:env/client';

const db = getFirestore(app);

// ⚠️ Usar import.meta.env para las variables de entorno
if (!PUBLIC_TUYA_ACCESS_KEY || !PUBLIC_TUYA_SECRET_KEY) {
  throw new Error('Las variables PUBLIC_TUYA_ACCESS_KEY y PUBLIC_TUYA_SECRET_KEY no están definidas en .env');
}

const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: PUBLIC_TUYA_ACCESS_KEY,
  secretKey: PUBLIC_TUYA_SECRET_KEY,
});


// 🧮 Función para calcular la presión de vapor de saturación (kPa)
const calculateSaturationVaporPressure = (temperature: number): number => {
  return 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
};

// 🧮 Función para calcular VPD (kPa)
const calculateVPD = (temperature: number, humidity: number): number => {
  const saturationVaporPressure = calculateSaturationVaporPressure(temperature);
  const actualVaporPressure = (humidity / 100) * saturationVaporPressure;
  const vpd = saturationVaporPressure - actualVaporPressure;
  return parseFloat(vpd.toFixed(2)); // Devolver con 2 decimales
};

// 🧮 Función para calcular el punto de rocío (dew point) en °C
const calculateDewPoint = (temperature: number, humidity: number): number => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return parseFloat(dewPoint.toFixed(2)); // Devolver con 2 decimales
};

export const GET: APIRoute = async ({ cookies }) => {
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

    const deviceStatus = await context.request({
      path: `/v1.0/iot-03/devices/${device_id}/status`,
      method: 'GET',
    });

    if (!deviceStatus.success) {
      return new Response(JSON.stringify({ error: 'Error al obtener el estado del dispositivo de Tuya' }), { status: 500 });
    }

    const status = deviceStatus.result;

    const rawTemperature = status.find((item: any) => item.code === 'va_temperature')?.value ?? 'N/A';
    const temperature = (typeof rawTemperature === 'number') 
      ? (rawTemperature / 10).toFixed(1) 
      : 'N/A';

    const rawHumidity = status.find((item: any) => item.code === 'va_humidity')?.value ?? 'N/A';
    const humidity = (typeof rawHumidity === 'number') 
      ? rawHumidity 
      : 'N/A';

    let vpd = 'N/A';
    let dewPoint = 'N/A';
    if (temperature !== 'N/A' && humidity !== 'N/A') {
      vpd = calculateVPD(parseFloat(temperature), humidity);
      dewPoint = calculateDewPoint(parseFloat(temperature), humidity);
    }

    return new Response(JSON.stringify({ temperature, humidity, vpd, dewPoint }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error al obtener el estado del dispositivo:", error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor', details: error.message }), { status: 500 });
  }
};
