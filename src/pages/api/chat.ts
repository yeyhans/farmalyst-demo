// src/pages/api/chat.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../firebase/server";

const db = getFirestore(app);

// Método POST: Enviar mensaje al chat
export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    // Verifica el token de sesión
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Extraer datos del mensaje desde el cuerpo de la solicitud
    const formData = await request.formData();
    const message = formData.get("message")?.toString();

    if (!message || message.trim() === "") {
      return new Response("Message cannot be empty", { status: 400 });
    }

    // Construir los datos del mensaje
    const messageData = {
      userId: userId,
      username: decodedToken.name || "Usuario Anónimo", // Nombre opcional
      message: message.trim(),
      timestamp: new Date().toISOString(), // Usar ISO para facilitar la ordenación
    };

    // Guardar el mensaje en la colección `chats`
    await db.collection("chats").add(messageData);

    // Devolver una respuesta de éxito
    return new Response(JSON.stringify({ success: true, message: messageData }), { status: 201 });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// Método GET: Obtener los mensajes del chat
export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    // Verifica el token de sesión
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Obtener los últimos 50 mensajes, ordenados por fecha
    const snapshot = await db.collection("chats").orderBy("timestamp", "desc").limit(50).get();
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Devolver los mensajes en formato JSON
    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    console.error("Error al obtener los mensajes:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
