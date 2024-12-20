import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/server";
import { createClient } from '@supabase/supabase-js';

import { 
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} from 'astro:env/server';


const db = getFirestore(app);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);
  const sessionCookie = cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response("No session found", { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // ⚡️ Acceder a la imagen cargada desde el formData
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${fileExtension}`;

    // ⚡️ Subir la imagen a Supabase Storage
    const { data, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, file.stream(), { upsert: true });

    if (uploadError) {
      console.error("Error uploading file to Supabase:", uploadError);
      return new Response("Failed to upload file", { status: 500 });
    }

    // ⚡️ Obtener la URL pública de la imagen
    const { data: publicURLData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicURLData.publicUrl;

    if (!avatarUrl) {
      console.error("Error getting public URL of the file");
      return new Response("Failed to retrieve public URL", { status: 500 });
    }

    // ⚡️ Guardar la URL de la imagen en Firestore
    await db.collection("profiles").doc(userId).set({ avatarUrl }, { merge: true });

    return new Response(
      JSON.stringify({ success: true, avatarUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error uploading avatar:", error);
    return new Response("Failed to upload avatar", { status: 500 });
  }
};
