import OpenAI from 'openai';
import { OPENAI_API_KEY } from 'astro:env/server';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function GET() {
  try {
    // Realizar una solicitud de prueba a la API de OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4', 
      messages: [
        { role: 'system', content: 'Eres un asistente muy útil.' }, 
        { role: 'user', content: '¿Cuál es la capital de Francia?' } 
      ],
      max_tokens: 50, 
      temperature: 0.7, 
    });

    return new Response(JSON.stringify({ 
      message: response.choices[0].message.content 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al llamar a la API de OpenAI:', error);
    return new Response(JSON.stringify({ error: 'Error al llamar a la API de OpenAI' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
