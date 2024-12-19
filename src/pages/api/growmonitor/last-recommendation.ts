import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";

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
