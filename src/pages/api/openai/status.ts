import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";
import OpenAI from 'openai';
import { OPENAI_API_KEY } from 'astro:env/server';

const db = getFirestore(app);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// 🟢 Método POST: Enviar pregunta al AI sobre el clima de cultivo
export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Obtener la información de la colección "profiles"
    const profileSnapshot = await db.collection("profiles").doc(userId).get();
    const profileData = profileSnapshot.exists ? profileSnapshot.data() : {};

    // Obtener la última información de clima del dispositivo
    const climateSnapshot = await db.collection("climateData").doc(userId).collection("climate").orderBy("timestamp", "desc").limit(1).get();
    const climateData = climateSnapshot.docs.length > 0 ? climateSnapshot.docs[0].data() : {};

    const {
      temperature = 'N/A',
      humidity = 'N/A',
      vpd = 'N/A',
      dewPoint = 'N/A',
      deviceName = 'Dispositivo Desconocido'
    } = climateData;

    const {
      preferredClimate = 'sin definir',
      idealHumidity = 'sin definir',
      idealTemperature = 'sin definir',
      climateComments = 'sin comentarios'
    } = profileData;

    // Generar el prompt personalizado con la información del clima
    const personalizedPrompt = `
      Actúa como un asesor especializado en control climático de cultivos. 
      Estoy utilizando un dispositivo llamado '${deviceName}' que actualmente registra una temperatura de '${temperature}°C', una humedad de '${humidity}%', un VPD de '${vpd} kPa' y un punto de rocío de '${dewPoint}°C'. 
      Mi preferencia de clima ideal es '${preferredClimate}', con una humedad ideal de '${idealHumidity}%' y una temperatura ideal de '${idealTemperature}°C'. 
      Además, me gustaría que tomes en cuenta que '${climateComments}' al momento de dar recomendaciones.
    `;

    const formData = await request.formData();
    const userMessage = formData.get("message")?.toString();

    if (!userMessage || userMessage.trim() === "") {
      return new Response("Message cannot be empty", { status: 400 });
    }

    // Datos del mensaje del usuario
    const userMessageData = {
      userId: userId,
      username: decodedToken.name || "Usuario Anónimo",
      role: "user",
      message: userMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Guardar el mensaje en Firestore
    const userMessageRef = await db.collection("masterclimate")
      .doc(userId)
      .collection("messages")
      .add(userMessageData);

    // Obtener los últimos 10 mensajes para dar contexto a OpenAI
    const snapshot = await db.collection("masterclimate")
      .doc(userId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const messageHistory = snapshot.docs
      .map((doc) => ({ role: doc.data().role, content: doc.data().message }))
      .reverse();

    // Agregar el prompt personalizado y la pregunta del usuario
    messageHistory.push(
      { role: "system", content: personalizedPrompt.trim() },
      { role: "user", content: userMessage }
    );

    // Llamar a OpenAI para obtener la respuesta de la IA
    const stream = await openai.beta.chat.completions.stream({
      model: 'gpt-4o',
      messages: messageHistory,
      stream: true,
    });

    let assistantResponse = "";

    // Capturar la respuesta de la IA de forma continua
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      assistantResponse += delta;
    }

    const assistantMessageData = {
      userId: userId,
      username: "AI Clima",
      role: "assistant",
      message: assistantResponse.trim(),
      timestamp: new Date().toISOString()
    };

    // Guardar la respuesta de la IA en Firestore
    const assistantMessageRef = await db.collection("masterclimate")
      .doc(userId)
      .collection("messages")
      .add(assistantMessageData);

    // Devolver la respuesta de la IA
    return new Response(JSON.stringify({ 
      success: true, 
      userMessage: userMessageData, 
      assistantMessage: assistantMessageData 
    }), { status: 201 });

  } catch (error) {
    console.error("Error en la API de masterclimate:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// 🟢 Método GET: Obtener los mensajes del usuario
export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const snapshot = await db.collection("masterclimate")
      .doc(userId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return new Response(JSON.stringify(messages), { status: 200 });

  } catch (error) {
    console.error("Error al obtener los mensajes:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
