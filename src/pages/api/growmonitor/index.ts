import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";
import OpenAI from 'openai';
import { OPENAI_API_KEY } from 'astro:env/server';

const db = getFirestore(app);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// 🟢 Método POST: Recibe las variables del entorno y genera recomendaciones
export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // 🔥 Comprobar la última vez que el usuario generó una recomendación
    const recommendationTimeRef = db.collection("growmonitor")
      .doc(userId)
      .collection("recommendationTime")
      .doc("lastRecommendation");

    const lastRecommendationDoc = await recommendationTimeRef.get();

    if (lastRecommendationDoc.exists) {
      const lastRecommendationTime = lastRecommendationDoc.data()?.timestamp;
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - new Date(lastRecommendationTime).getTime();

      if (timeDiff < 24 * 60 * 60 * 1000) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Debe esperar 24 horas antes de solicitar otra recomendación.` 
          }), 
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const realTimeData = {
      temperature: parseFloat(body.temperature) || 0,
      humidity: parseFloat(body.humidity) || 0,
      vpd: parseFloat(body.vpd) || 0,
      dewPoint: parseFloat(body.dewPoint) || 0,
    };

    const dailyData = {
      maxTemperature: parseFloat(body.maxTemperature) || 0,
      minTemperature: parseFloat(body.minTemperature) || 0,
      maxHumidity: parseFloat(body.maxHumidity) || 0,
      minHumidity: parseFloat(body.minHumidity) || 0,
    };

    const userPrompt = body.userPrompt || 'No se especificó un prompt del usuario';

    const personalizedPrompt = `
      Actúa como un asesor de cultivo experto para plantas herbáceas y medicinales.
      Las condiciones actuales del cultivo son las siguientes:
      - Temperatura actual: ${realTimeData.temperature}°C
      - Humedad actual: ${realTimeData.humidity}%
      - VPD actual: ${realTimeData.vpd}
      - Punto de rocío actual: ${realTimeData.dewPoint}°C
      
      En las últimas 24 horas, se registró lo siguiente:
      - Temperatura máxima: ${dailyData.maxTemperature}°C
      - Temperatura mínima: ${dailyData.minTemperature}°C
      - Humedad máxima: ${dailyData.maxHumidity}%
      - Humedad mínima: ${dailyData.minHumidity}%
      
      ${userPrompt}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: personalizedPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, 
      max_tokens: 1500, 
      stop: ["\n\n"]
    });


    const assistantMessage = response.choices[0]?.message?.content || 'No se pudo generar una respuesta';

    const recommendationData = {
      userId: userId,
      timestamp: new Date().toISOString(),
      message: assistantMessage
    };

    // 🔥 Guardar la respuesta de la IA en Firestore
    await db.collection("growmonitor")
      .doc(userId)
      .collection("recommendations")
      .add(recommendationData);

    // 🔥 Guardar la marca de tiempo de la última recomendación
    await recommendationTimeRef.set({ timestamp: new Date().toISOString() });

    return new Response(JSON.stringify({ 
      success: true, 
      assistantMessage 
    }), { status: 201 });

  } catch (error) {
    console.error("Error en la API de growmonitor:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// 🟢 Método GET: Obtener las últimas 24 horas de datos del entorno
export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const snapshot = await db.collection("growmonitor")
      .doc(userId)
      .collection("environmentData")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const environmentData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return new Response(JSON.stringify(environmentData), { status: 200 });

  } catch (error) {
    console.error("Error al obtener los datos del entorno:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// 🟢 Nueva Ruta GET: Obtener la última recomendación
export const GET_LAST_RECOMMENDATION: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // 🔥 Obtener la última recomendación
    const snapshot = await db.collection("growmonitor")
      .doc(userId)
      .collection("recommendations")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const recommendationData = snapshot.docs[0].data();
      return new Response(JSON.stringify({ 
        recommendation: recommendationData.message, 
        timestamp: recommendationData.timestamp 
      }), { status: 200 });
    }

    return new Response(JSON.stringify({ recommendation: null }), { status: 200 });

  } catch (error) {
    console.error("Error al obtener la última recomendación:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
