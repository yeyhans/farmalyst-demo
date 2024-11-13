// src/pages/api/samples/register.ts
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
    const sampleId = formData.get("sampleId")?.toString();  // ID de muestra (si se proporciona para edición)
    const name = formData.get("name")?.toString();
    const bank = formData.get("bank")?.toString();
    const category = formData.get("category")?.toString();  // Usado solo para creación

    if (!name || !bank || (!sampleId && !category)) {
        console.error("Missing form data:", { sampleId, name, bank, category });
        return new Response("Faltan datos necesarios para el registro o la actualización.", { status: 400 });
    }

    try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        const userId = decodedToken.uid;

        if (sampleId) {
            // Proceso de actualización
            const sampleDoc = await db.collection("samples").doc(sampleId).get();
            if (!sampleDoc.exists || sampleDoc.data()?.userId !== userId) {
                console.error("Sample not found or user is not the owner.");
                return new Response("No tienes permiso para editar esta muestra", { status: 403 });
            }

            await db.collection("samples").doc(sampleId).update({ name, bank });
            console.log("Muestra actualizada correctamente:", { sampleId, name, bank });
        } else {
            // Proceso de creación
            const sampleData = {
                name,
                bank,
                category,
                createdAt: new Date(),
                userId,
            };
            await db.collection("samples").add(sampleData);
            console.log("Nueva muestra creada:", sampleData);
        }

        return redirect("/register-samples");
    } catch (error) {
        console.error("Error en la operación de registro o actualización:", error);
        return new Response("Error en la operación de registro o actualización", { status: 500 });
    }
};
