# agent-skill-ivan

Skill personal de Ivan Gavilan. Contiene las mejores prácticas, patrones y configuraciones que se aplican a TODOS los agentes de IA que construye, independientemente del canal (WhatsApp, Instagram, web, etc.) o plataforma de destino.

Cargar este skill siempre que se esté construyendo o modificando un agente de IA para Ivan.

---

## Stack base de Ivan

- **Runtime:** Cloudflare Workers + Durable Objects
- **IA:** OpenAI (tiene cuenta activa con saldo)
- **CRM/Mensajería:** Chatwoot (self-hosted o cloud, misma API)
- **Canales:** WhatsApp e Instagram via Chatwoot
- **Experiencia previa:** agentes en n8n para clientes activos

---

## Características que se aplican SIEMPRE a sus agentes

### ⚠️ Regla crítica — guardar estado ANTES de llamar a APIs externas

En Durable Objects, si el `alarm()` lanza una excepción o hace `return` antes de guardar, **Cloudflare reintenta la alarma automáticamente**. Si el estado (pendingChunks, etc.) no fue guardado como vacío antes de la llamada externa, el retry procesa el mismo mensaje en loop → gasto descontrolado.

**Siempre hacer `save()` con el estado limpio ANTES de llamar a OpenAI o cualquier API:**

```typescript
async alarm(): Promise<void> {
  const conv = await this.load();
  if (!conv || conv.pendingChunks.length === 0) return;

  const userMessage = conv.pendingChunks.join(" ").trim();
  conv.pendingChunks = []; // limpiar en memoria
  conv.timerActive = false;
  conv.history.push({ role: "user", content: userMessage });

  await this.save(conv); // ← GUARDAR AQUÍ, antes de OpenAI

  // Recién ahora llamar a OpenAI
  const completion = await openai.chat.completions.create({...});
}
```

---

### 1. Timer de agrupación de mensajes (20s en producción, 10s en pruebas)

Los humanos mandan varios mensajes para decir una sola cosa. El agente NUNCA responde al primer chunk — acumula y espera.

**Implementación con Durable Object alarm:**
```typescript
// Al llegar un mensaje: acumular y (re)setear alarma
conv.pendingChunks.push(msg.text.trim());
await this.state.storage.setAlarm(Date.now() + TIMER_MS); // 20_000 prod / 10_000 pruebas

// En alarm(): unir todos los chunks y procesar
const userMessage = conv.pendingChunks.join(" ").trim();
```

El timer se resetea con cada nuevo chunk. Solo procesa cuando no llegaron más mensajes en los últimos N segundos.

---

### 2. Respuestas en múltiples mensajes (más humano)

La IA puede responder en 1, 2 o 3 mensajes según lo que corresponda. Los separa con el delimitador `---MENSAJE---` y el worker los envía uno por uno.

**En el system prompt:**
```
Respondés en 1, 2 o 3 mensajes según lo que corresponda.
Si mandás más de uno, separá con "---MENSAJE---" exacto.
Nunca más de 3 mensajes por turno.
Mensajes cortos y naturales, como WhatsApp.
```

**En el worker:**
```typescript
const parts = aiResponse.split("---MENSAJE---").map(p => p.trim()).filter(Boolean);
for (const part of parts) {
  await sendMessage(conversationId, part);
}
```

---

### 3. Control de encendido/apagado de la IA por contacto

La IA se puede apagar por contacto sin tocar código. Se usa un atributo en el CRM.

**En Chatwoot:** `custom_attributes.bot = "on" | "off"`
- `"on"` → IA activa (responde)
- `"off"` → IA apagada (ignora todos los mensajes)
- ausente → tratar como activa

**Verificación al recibir webhook:**
```typescript
const botStatus = body.sender?.custom_attributes?.bot;
if (botStatus === "off") return; // ignorar silenciosamente
```

**Al derivar a humano** (2 requests a Chatwoot):
```typescript
// 1. Etiquetar conversación
POST /api/v1/accounts/{id}/conversations/{convId}/labels
{ labels: ["derivado"] }

// 2. Apagar la IA para ese contacto
PATCH /api/v1/accounts/{id}/contacts/{contactId}
{ custom_attributes: { bot: "off" } }
```

---

### 4. Señal de derivación en la respuesta de la IA

Cuando la IA decide que hay que pasar a un humano, agrega `[[DERIVAR]]` al final de su último mensaje. El worker detecta esa cadena, la elimina del texto antes de enviarlo, y ejecuta los 2 requests de derivación.

**En el system prompt:**
```
Cuando el usuario confirme que quiere turno/hablar con alguien:
respondé normalmente y al final del último mensaje agregá exactamente [[DERIVAR]].
NO derivar si solo pregunta precios o muestra interés general.
Solo derivar ante confirmación explícita.
```

**En el worker:**
```typescript
if (aiResponse.includes("[[DERIVAR]]")) {
  shouldDerivar = true;
  aiResponse = aiResponse.replace("[[DERIVAR]]", "").trim();
}
```

---

### 5. Textos fijos hardcodeados (no generados por IA)

Cuando el negocio necesita que ciertos textos salgan exactamente igual siempre (fichas de tratamientos, precios, etc.), la IA los referencia con una clave y el worker los inyecta.

**La IA escribe:** `[[TRATAMIENTO:botox]]`
**El worker reemplaza:** por el texto exacto del mapa `TRATAMIENTOS`

```typescript
const TRATAMIENTOS: Record<string, string> = {
  botox: `Texto exacto del tratamiento...`,
  limpieza: `Texto exacto...`,
};

aiResponse = aiResponse.replace(/\[\[TRATAMIENTO:(\w+)\]\]/g, (_, clave) => {
  return TRATAMIENTOS[clave] ?? `(info no disponible)`;
});
```

---

### 6. Comando RESET silencioso

Para pruebas, mandar `RESET` como mensaje limpia el historial y estado del DO sin que la IA responda nada.

```typescript
if (msg.text.trim().toUpperCase() === "RESET") {
  conv.history = [];
  conv.pendingChunks = [];
  conv.derivado = false;
  await save(conv);
  return; // sin respuesta
}
```

---

### 7. Optimizaciones de costo (OpenAI)

Ver `reference/optimizaciones.md` para el detalle completo. Resumen:

| Config | Valor | Por qué |
|---|---|---|
| Modelo | `gpt-4.1` | Calidad + costo balanceado |
| Historial | 10 turnos máx | Limitar tokens de contexto |
| `max_tokens` respuesta | 600 | Suficiente para 1-3 mensajes cortos |
| System prompt | **Estático** | Habilita prompt caching (~50% descuento) |
| Fecha dinámica | Al final del user message | No rompe el cache del system prompt |

---

### 8. Webhook de Chatwoot

Ver `reference/chatwoot-webhook.md` para el JSON completo. Puntos clave:

- `body.event === "message_created"` → único evento que procesar
- `body.message_type === "incoming"` (string) → mensaje del usuario
- `body.inbox.id` → filtrar por inbox específico
- `body.sender.custom_attributes.bot` → control on/off de la IA
- `body.conversation.id` → ID para responder y etiquetar
- `body.sender.id` → ID para modificar atributos del contacto

---

## Archivos de referencia

- `reference/chatwoot-webhook.md` — JSON completo del webhook + campos importantes
- `reference/optimizaciones.md` — Configuraciones de costo para OpenAI
- `blueprints/worker-chatwoot.ts` — Template completo Cloudflare Worker + Durable Object
