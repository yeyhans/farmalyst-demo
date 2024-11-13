// src/pages/api/samples/delete.ts
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";

const db = getFirestore(app);

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const auth = getAuth(app);
    const sessionCookie = cookies.get("__session")?.value;

    if (!sessionCookie) {
        return new Response("No session found", { status: 401 });
    }

    const formData = await request.formData();
    const sampleId = formData.get("sampleId")?.toString();

    try {
        await db.collection("samples").doc(sampleId).delete();
        return redirect("/register-samples");
    } catch (error) {
        console.error("Error al eliminar la muestra:", error);
        return new Response("Error al eliminar la muestra", { status: 500 });
    }
};
