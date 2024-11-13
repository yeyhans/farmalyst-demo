// src/pages/api/profile.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../firebase/server";

const db = getFirestore(app);

export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;
    const userRecord = await auth.getUser(userId);

    // Obtener datos adicionales del perfil desde Firestore
    const profileDoc = await db.collection("profiles").doc(userId).get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    // Combinar datos de Firebase Auth y Firestore
    const userData = {
      displayName: userRecord.displayName,
      email: userRecord.email,
      ...profileData, // Añadir datos adicionales de Firestore
    };

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    return new Response("Failed to fetch user data", { status: 500 });
  }
};
