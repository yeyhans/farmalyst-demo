// src/pages/api/evaluations/save.ts
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

  const formData = await request.formData();
  const evaluationId = formData.get("evaluationId")?.toString();
  const sampleCode = formData.get("sampleCode")?.toString();
  const visual = parseInt(formData.get("visual")?.toString() || "0");
  const chemosensory = parseInt(formData.get("chemosensory")?.toString() || "0");
  const tasting = parseInt(formData.get("tasting")?.toString() || "0");
  const experience = parseInt(formData.get("experience")?.toString() || "0");
  const classification = formData.get("classification")?.toString();
  const comments = formData.get("comments")?.toString() || "";

  if (!sampleCode || !visual || !chemosensory || !tasting || !experience || !classification) {
    return new Response("Faltan datos de evaluación", { status: 400 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Check for duplicate sample code if this is a new evaluation (without an evaluationId)
    if (!evaluationId) {
      const duplicateCheck = await db.collection("evaluations")
        .where("userId", "==", userId)
        .where("sampleCode", "==", sampleCode)
        .get();

      if (!duplicateCheck.empty) {
        return new Response("duplicate_sample", { status: 400 });
      }
    }

    const evaluationData = {
      sampleCode,
      visual,
      chemosensory,
      tasting,
      experience,
      classification,
      comments,
      userId,
      updatedAt: new Date(),
    };

    if (evaluationId) {
      // Update the evaluation if evaluationId is provided
      await db.collection("evaluations").doc(evaluationId).set(evaluationData, { merge: true });
    } else {
      // Create a new evaluation if no evaluationId is provided
      evaluationData["createdAt"] = new Date();
      await db.collection("evaluations").add(evaluationData);
    }

    return new Response(null, {
      status: 303,
      headers: { Location: "/evaluations" },
    });
  } catch (error) {
    console.error("Error al guardar la evaluación:", error);
    return new Response("Error al guardar la evaluación", { status: 500 });
  }
};
