# Manejo de audios en agentes de WhatsApp

Los usuarios de WhatsApp mandan audios frecuentemente. El agente debe poder procesarlos.

## Flujo

1. Chatwoot recibe el audio y lo adjunta al mensaje
2. El webhook llega con `content_type: "audio"` y la URL del archivo en `attachments`
3. El worker descarga el audio y lo transcribe con OpenAI Whisper
4. La transcripción se trata como texto normal y pasa al pipeline de IA

## Estructura del webhook con audio

```json
{
  "event": "message_created",
  "message_type": "incoming",
  "content": "",
  "content_type": "audio",
  "attachments": [
    {
      "id": 123,
      "message_id": 456,
      "file_type": "audio",
      "account_id": 1,
      "file_url": "https://crm.tudominio.com/rails/active_storage/blobs/.../audio.ogg",
      "thumb_url": ""
    }
  ]
}
```

## Detección en el webhook handler

```typescript
const contentType = body.content_type as string;
const attachments = body.attachments as Array<{ file_url: string; file_type: string }> | undefined;

let textContent = (body.content as string) ?? "";

if (contentType === "audio" && attachments?.length) {
  const audioUrl = attachments[0].file_url;
  textContent = await transcribeAudio(audioUrl, env.OPENAI_API_KEY);
}

if (!textContent.trim()) return Response.json({ ok: true, skipped: "empty_content" });
```

## Función de transcripción con Whisper

```typescript
async function transcribeAudio(audioUrl: string, apiKey: string): Promise<string> {
  // 1. Descargar el audio desde Chatwoot
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) return "";
  const audioBlob = await audioRes.blob();

  // 2. Enviar a Whisper via OpenAI
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.ogg");
  formData.append("model", "whisper-1");
  formData.append("language", "es");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!whisperRes.ok) return "";
  const data = await whisperRes.json<{ text: string }>();
  return data.text ?? "";
}
```

## Agregar OPENAI_API_KEY al contexto del DO

Para que el Durable Object pueda llamar a Whisper, la key de OpenAI ya está disponible en `this.env.OPENAI_API_KEY`.

## Notas

- Whisper soporta: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
- WhatsApp envía audios en formato `.ogg` (opus codec)
- Costo de Whisper: $0.006 / minuto — muy bajo
- Agregar al system prompt: "A veces el usuario manda audios. Vas a recibir la transcripción como texto normal, tratala igual."
