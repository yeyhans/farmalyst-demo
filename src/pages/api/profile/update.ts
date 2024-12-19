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
    const device_id = formData.get("device_id")?.toString();
    const deviceName = formData.get("deviceName")?.toString();
  
    try {
      const decodedToken = await auth.verifySessionCookie(sessionCookie);
      const userId = decodedToken.uid;

      // ⚡️ Actualizar nombre y contraseña en Firebase Auth
      const updateData: { displayName?: string; password?: string } = {};
      if (name) updateData.displayName = name;
      if (password) updateData.password = password;

      // ⚠️ Asegurarse de que la actualización de Auth se complete antes de continuar
      await auth.updateUser(userId, updateData);
  
      // ⚡️ Guardar los datos adicionales en Firestore
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
        device_id,
        deviceName,
      };

      // ⚠️ Esperar a que se actualicen los datos de Firestore
      await db.collection("profiles").doc(userId).set(profileData, { merge: true });

      // ⚡️ Actualizar el nombre del dispositivo en Tuya
      if (device_id && deviceName) {
        const requestUrl = new URL(request.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

        const response = await fetch(`${baseUrl}/api/tuya/device`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id, deviceName }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error("Error al actualizar el nombre del dispositivo en Tuya:", result);
        }
      }

      // 🔥 Redirigir solo cuando TODO esté completo
      return redirect("/profile");
    } catch (error) {
      console.error("Error al actualizar el perfil del usuario:", error);
      return new Response("Failed to update user data", { status: 500 });
    }
};
