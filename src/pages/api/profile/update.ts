// src/pages/api/profile/update.ts
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
    const name = formData.get("name")?.toString();
    const password = formData.get("password")?.toString();
    const age = formData.get("age")?.toString();
    const gender = formData.get("gender")?.toString();
    const phone = formData.get("phone")?.toString();
    const country = formData.get("country")?.toString();
    const mainCropType = formData.get("main_crop_type")?.toString();
    const varieties = formData.get("varieties")?.toString();
    const cultivationMethod = formData.get("cultivation_method")?.toString();
    const lighting = formData.get("lighting")?.toString();
    const irrigation = formData.get("irrigation")?.toString();
    const comments = formData.get("comments")?.toString();
  
    try {
      const decodedToken = await auth.verifySessionCookie(sessionCookie);
      const userId = decodedToken.uid;
  
      // Actualizar nombre y contraseña en Firebase Auth, si se proporcionan
      const updateData: { displayName?: string; password?: string } = {};
      if (name) updateData.displayName = name;
      if (password) updateData.password = password;
      await auth.updateUser(userId, updateData);
  
      // Guardar los datos adicionales en Firestore
      const profileData = {
        age,
        gender,
        phone,
        country,
        mainCropType,
        varieties,
        cultivationMethod,
        lighting,
        irrigation,
        comments,
      };
      await db.collection("profiles").doc(userId).set(profileData, { merge: true });
  
      // Redirigir a /profile después de la actualización
      return redirect("/profile");
    } catch (error) {
      console.error("Error al actualizar el perfil del usuario:", error);
      return new Response("Failed to update user data", { status: 500 });
    }
  };