// src/pages/api/mastergrower.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../firebase/server";
import OpenAI from 'openai';

const db = getFirestore(app);
const openai = new OpenAI();

// 🟢 Método POST: Enviar pregunta al AI sobre cultivos
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

    const {
      mainCropType = 'sin definir',
      lighting = 'sin definir',
      irrigation = 'sin definir',
      varieties = 'sin definir',
      comments = 'sin comentarios'
    } = profileData;

    // Generar el prompt personalizado con la información del perfil
    const personalizedPrompt = `
      Actúa como experto en horticultura de cualquier tipo de plantas medicinales o recreacionales, especialmente de origen herbáceas, cáñamo o cannabis. 
      Orienta la respuesta al estilo de cultivo '${mainCropType}', la iluminación que utilizo normalmente es '${lighting}', te informo que '${irrigation}' uso sistema de riego, me gusta cultivar variedades como '${varieties}' y de modo general te puedo comentar sobre mi cultivo que '${comments}'.
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
    const userMessageRef = await db.collection("mastergrower")
      .doc(userId)
      .collection("messages")
      .add(userMessageData);

    // Obtener los últimos 10 mensajes para dar contexto a OpenAI
    const snapshot = await db.collection("mastergrower")
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

    const finalChatCompletion = await stream.finalChatCompletion();

    const assistantMessageData = {
      userId: userId,
      username: "AI Cultivo",
      role: "assistant",
      message: assistantResponse.trim(),
      timestamp: new Date().toISOString()
    };

    // Guardar la respuesta de la IA en Firestore
    const assistantMessageRef = await db.collection("mastergrower")
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
    console.error("Error en la API de mastergrower:", error);
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

    const snapshot = await db.collection("mastergrower")
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
