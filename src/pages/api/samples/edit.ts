// src/pages/api/samples/edit.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";

const db = getFirestore(app);

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const auth = getAuth(app);
    const sessionCookie = cookies.get("__session")?.value;

    if (!sessionCookie) {
        console.error("No session cookie found.");
        return new Response("No session found", { status: 401 });
    }

    const formData = await request.formData();
    const sampleId = formData.get("sampleId")?.toString();
    const name = formData.get("name")?.toString();
    const bank = formData.get("bank")?.toString();

    if (!sampleId || !name || !bank) {
        console.error("Missing form data:", { sampleId, name, bank });
        return new Response("Faltan datos necesarios para la actualización.", { status: 400 });
    }

    try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        const userId = decodedToken.uid;

        // Verificar que el usuario sea el propietario de la muestra antes de editarla
        const sampleDoc = await db.collection("samples").doc(sampleId).get();
        if (!sampleDoc.exists || sampleDoc.data()?.userId !== userId) {
            console.error("Sample not found or user is not the owner.");
            return new Response("No tienes permiso para editar esta muestra", { status: 403 });
        }

        await db.collection("samples").doc(sampleId).update({ name, bank });
        return redirect(`/register-samples`);
    } catch (error) {
        console.error("Error al editar la muestra:", error);
        return new Response("Error al editar la muestra", { status: 500 });
    }
};
