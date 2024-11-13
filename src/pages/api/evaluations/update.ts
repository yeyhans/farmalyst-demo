// src/pages/api/evaluations/update/[id].ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";

const db = getFirestore(app);

export const POST: APIRoute = async ({ request, params, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  const formData = await request.formData();
  const sampleCode = formData.get("sampleCode")?.toString();
  const visual = parseInt(formData.get("visual")?.toString() || "0");
  const chemosensory = parseInt(formData.get("chemosensory")?.toString() || "0");
  const tasting = parseInt(formData.get("tasting")?.toString() || "0");
  const experience = parseInt(formData.get("experience")?.toString() || "0");
  const classification = formData.get("classification")?.toString();
  const comments = formData.get("comments")?.toString() || "";

  const evaluationId = params.id;

  if (!sampleCode || !visual || !chemosensory || !tasting || !experience || !classification) {
    return new Response("Faltan datos de evaluación", { status: 400 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const evaluationRef = db.collection("evaluations").doc(evaluationId);
    const evaluationDoc = await evaluationRef.get();

    if (!evaluationDoc.exists || evaluationDoc.data()?.userId !== userId) {
      return new Response("Evaluation not found or unauthorized", { status: 404 });
    }

    const evaluationData = {
      sampleCode,
      visual,
      chemosensory,
      tasting,
      experience,
      classification,
      comments,
      updatedAt: new Date(),
    };

    await evaluationRef.update(evaluationData);
    return new Response(null, { status: 303, headers: { Location: "/evaluations" } });
  } catch (error) {
    console.error("Error al actualizar la evaluación:", error);
    return new Response("Failed to update evaluation", { status: 500 });
  }
};
