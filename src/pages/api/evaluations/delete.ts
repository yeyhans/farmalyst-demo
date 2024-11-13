// src/pages/api/evaluations/delete.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";

const db = getFirestore(app);

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  const { evaluationId } = await request.json();

  if (!evaluationId) {
    return new Response("No evaluation ID provided", { status: 400 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const evaluationRef = db.collection("evaluations").doc(evaluationId);
    const evaluationDoc = await evaluationRef.get();

    if (!evaluationDoc.exists || evaluationDoc.data().userId !== userId) {
      return new Response("Evaluation not found or unauthorized", { status: 404 });
    }

    await evaluationRef.delete();
    return new Response("Evaluation deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error al eliminar la evaluación:", error);
    return new Response("Failed to delete evaluation", { status: 500 });
  }
};
