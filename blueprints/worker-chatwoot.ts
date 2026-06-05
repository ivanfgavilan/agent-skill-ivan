/**
 * Agente Sofía — Asistente IA de la Dra. Luz Herrera
 * Medicina Estética · Salta y Tucumán, Argentina
 */

import OpenAI from "openai";

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 10;
const TIMER_MS = 10_000; // 10s en pruebas, subir a 20_000 en producción

// ─────────────────────────────────────────────
// TEXTOS FIJOS DE TRATAMIENTOS
// La IA escribe [[TRATAMIENTO:clave]] y el worker lo reemplaza por este texto exacto.
// ─────────────────────────────────────────────

const TRATAMIENTOS: Record<string, string> = {
  limpieza: `La limpieza facial profunda es un tratamiento diseñado para renovar, purificar y realzar la belleza natural de tu piel.

Nuestra limpieza facial profunda combina técnicas especializadas y productos seleccionados para lograr una piel más uniforme, luminosa y saludable.

Trabajamos de forma personalizada, respetando las necesidades de cada biotipo cutáneo.

🧴 Realizado por cosmetólogas profesionales.

Experiencia de tratamiento
• Diagnóstico de la piel
• Higiene profunda
• Exfoliación específica
• Microdermoabrasión con punta de diamante
• Extracción cuidadosa de impurezas
• Máscaras nutritivas y descongestivas
• Masaje facial revitalizante
• Alta frecuencia adaptada a tu piel / radiofrecuencia / espátula ultrasónica. Según necesidad

Frecuencia recomendada
Una vez al mes, según evaluación profesional.

$49.000
✨ Valor promocional: $39.000

👉 Ideal para quienes buscan resultados visibles con una experiencia de cuidado integral.`,

  botox: `Botox / Toxina Botulínica es un tratamiento que ayuda a suavizar líneas de expresión y prevenir arrugas en zonas como frente, entrecejo y patas de gallo, manteniendo una expresión natural 😊

💵 Botox frente + entrecejo + patas de gallo:
$690.000
✔️ Incluye control y retoque posterior.

💵 Solo patas de gallo:
$300.000
✔️ Incluye control posterior.

📌 El procedimiento se realiza en consultorio, es rápido y prácticamente indoloro.

⏳ La duración del efecto suele ser de aproximadamente 4 a 6 meses, dependiendo de cada paciente.

✨ En ocasiones especiales contamos con promociones abonando en efectivo o transferencia, o cuotas sin interés 🙌`,

  rinomodelacion: `Rinomodelación con Ácido Hialurónico ✨

La rinomodelación es un procedimiento estético no quirúrgico que realizamos en consultorio para mejorar el perfil y la forma de la nariz de manera armónica y natural 😊

Mediante la aplicación de ácido hialurónico, la Dra. Luz Herrera puede corregir pequeñas imperfecciones, levantar la punta nasal o mejorar el contorno, sin cirugía y con resultados inmediatos 🙌

📌 Es un procedimiento rápido, prácticamente indoloro y mínimamente invasivo.
⏳ Duración aproximada: 30 minutos
⏳ Duración del resultado: entre 18 y 24 meses, dependiendo de cada paciente.

💵 Valor: $790.000 realizado por la Dra. Luz Herrera`,

  armonizacion: `La armonización facial es un tratamiento integral que combina distintas técnicas como ácido hialurónico, toxina botulínica y otros procedimientos complementarios, buscando devolver volumen, mejorar proporciones y rejuvenecer el rostro de manera natural 🙌

El objetivo siempre es conservar tu armonía facial y realzar tus rasgos sin perder naturalidad 💫

📌 La duración de los resultados puede variar según el tratamiento y cada paciente, pero generalmente ronda los 12 meses.`,

  labios: `Labios con Ácido Hialurónico ✨

El tratamiento de labios permite perfilar, hidratar y dar volumen de manera armónica y natural 💋

La Dra. Luz realiza un diseño personalizado según la forma de tu rostro y el resultado que busques, priorizando siempre la naturalidad 🙌

💵 Marca importada premium: $635.000
💵 Marca importada económica: $375.000

📌 El procedimiento se realiza en consultorio, dura aproximadamente 30 minutos y utilizamos anestesia tópica para mayor comodidad.
⏳ La duración del resultado puede variar según cada organismo y el producto utilizado, generalmente entre 6 y 12 meses.

✨ Abonando en efectivo o transferencia podés acceder a descuentos especiales en determinadas fechas 🙌`,

  sculptra: `✨ Sculptra ✨

Sculptra es un bioestimulador de colágeno no invasivo que ayuda a mejorar la calidad, firmeza y estructura de la piel de manera progresiva y natural 😊

💫 Actúa estimulando la producción natural de colágeno, logrando con el tiempo una piel más firme, luminosa y rejuvenecida 🙌

Se aplica mediante pequeñas infiltraciones debajo de la piel, en zonas donde hubo pérdida de volumen, flacidez o estructura facial.

📌 Ayuda a mejorar:
• Flacidez
• Pérdida de firmeza
• Calidad de piel
• Volumen facial
• Envejecimiento cutáneo

✨ Los resultados comienzan a verse progresivamente y continúan mejorando a medida que el cuerpo genera nuevo colágeno. Generalmente se indican 3 sesiones, una por mes.
⏳ Sus resultados pueden durar entre 2 y 3 años aproximadamente, dependiendo de cada paciente.

📌 Lo ideal siempre es realizar una evaluación previa para asesorarte y confirmar si este bioestimulador es el indicado para vos 😊`,

  mela: `✨ MELA Láser ✨

La MELA Láser es un tratamiento mini invasivo que ayuda a reducir adiposidad localizada, mejorar la firmeza de la piel y redefinir contornos corporales de manera mucho más precisa 😊

💫 Puede realizarse tanto en papada como en distintas zonas del cuerpo, dependiendo de cada caso y del objetivo que busques.

Además de reducir grasa localizada, ayuda a mejorar la retracción de la piel y definir mejor el contorno corporal 🙌

📌 Es un procedimiento que requiere una evaluación previa personalizada para que podamos analizar tus expectativas y confirmar si realmente es el tratamiento indicado para vos ✨

💵 El presupuesto se define únicamente luego de la consulta y evaluación médica, ya que depende de las zonas a tratar y del abordaje necesario 😊`,

  endymed_corporal: `Hola cómo estás? ENDYMED 3DEEP PRO 🌟

¿Cómo funciona?
Calentando la dermis profunda alcanzando las fibras de colágeno provocando un efecto tensor inmediato y a largo plazo.

El rejuvenecimiento cutáneo trata las diferentes capas de la piel para obtener los mejores resultados 🤗

Los tratamientos de Endymed son seguros, indoloros y adecuados para todos los tipos de piel. Los resultados los podés ver desde la primera sesión ☺️

Precio de la sesión en corporal está en $60.000 dependiendo si vamos a tratar flacidez, adiposidad localizada o celulitis.

Lo ideal sería 10 a 12 sesiones semanales. Lo ideal sería evaluarte y asesorarte, así armamos juntas un combo ideal para vos.

Se realizan controles fotográficos y evaluaciones mensuales.

Si estás interesada en rostro consultame.`,

  endymed_facial: `✨ ENDYMED 3DEEP PRO Facial ✨

Es un tratamiento de radiofrecuencia avanzada que ayuda a tensar, reafirmar y rejuvenecer la piel de manera no invasiva 😊

¿Cómo funciona?
Trabaja calentando las capas profundas de la piel para estimular la producción natural de colágeno y elastina, logrando un efecto tensor inmediato y también progresivo en el tiempo 🙌

💫 Ayuda a mejorar:
• Flacidez
• Textura de la piel
• Arrugas finas
• Definición de papada y cuello

📌 Es un procedimiento seguro, indoloro y apto para todo tipo de piel.
✨ Muchas pacientes comienzan a notar resultados desde las primeras sesiones.

💵 Mejillas + papada + cuello:
• 1 sesión: $60.000
• Pack 6 sesiones: $310.000

📅 Las sesiones se realizan semanalmente y hacemos seguimiento fotográfico personalizado durante el tratamiento 😊

Si te interesa trabajar otras zonas como párpados o corporal, también podemos asesorarte ✨`,

  prp: `✨ Plasma Rico en Plaquetas (PRP) ✨
(Duración aproximada: 30 minutos)

Es un tratamiento regenerativo que utiliza componentes de tu propia sangre para estimular la reparación y rejuvenecimiento de la piel y el cuero cabelludo 😊

💫 Ayuda a mejorar:
• Calidad y luminosidad de la piel
• Arrugas finas
• Flacidez leve
• Marcas
• Fortalecimiento y crecimiento capilar

📌 Trabajamos junto a bioquímicas certificadas para garantizar seguridad y calidad en cada aplicación 🙌

📅 Generalmente se indican 4 sesiones, una por mes.

💵 Valor con Dra. Luz: $150.000
💵 Valor con staff: $90.000 ✨

Las fechas se coordinan previamente ya que se realizan jornadas específicas una vez al mes 😊`,

  dermapen: `✨ Dermapen con Exosomas ✨
(Duración aproximada: 40 minutos)

Es un tratamiento regenerativo avanzado que combina microneedling con exosomas, potenciando la producción natural de colágeno y elastina 😊

💫 Ayuda a mejorar:
• Firmeza
• Luminosidad
• Textura de la piel
• Manchas
• Arrugas finas
• Cicatrices de acné

✨ La piel se ve más renovada, hidratada y uniforme progresivamente 🙌

📅 Generalmente se indican 3 sesiones, una cada 15 a 20 días.

💵 Valor con staff: $200.000 por sesión
💵 Valor con Dra. Luz: $450.000 por sesión

📌 Puede combinarse con otros tratamientos regenerativos según cada caso 😊`,

  hifu: `✨ HIFU Facial + Tratamientos Complementarios ✨

💫 HIFU Facial Completo
(Duración aproximada: 1 hora)
Ayuda a tensar y reafirmar la piel estimulando colágeno en profundidad 😊
💵 1 sesión + drenaje linfático: $150.000

✨ HIFU en Papada
(Duración aproximada: 40 minutos)
Ayuda a mejorar flacidez y adiposidad localizada en la zona de papada 🙌
📅 Incluye 3 sesiones + 3 drenajes linfáticos
💵 Valor pack: $200.000

✨ Crío Radiofrecuencia
(Duración aproximada: 30 minutos)
Tratamiento ideal para tensar la piel y mejorar flacidez 😊
💫 Combina calor y frío terapéutico, ayudando también a estimular colágeno y mejorar adiposidad localizada.
📅 Se recomienda realizar 8 sesiones, una por semana.
💵 Valor por sesión: $30.000
💵 Pack 8 sesiones: $180.000 ✨`,

  dermaplaning: `✨ Dermaplaning ✨

Es un tratamiento de exfoliación física y mecánica que elimina suavemente células muertas y el vello fino del rostro 😊

💫 Ayuda a mejorar:
• Textura de la piel
• Luminosidad
• Suavidad
• Absorción de productos
• Efecto "piel glow"

✨ La piel queda mucho más lisa, luminosa y uniforme desde la primera sesión 🙌

📌 Es ideal combinarlo con una limpieza facial profunda para potenciar resultados.

💵 Valor por sesión: $35.000`,

  laser_co2: `✨ Láser CO2 ✨

Es un tratamiento regenerativo avanzado que ayuda a renovar profundamente la piel estimulando la producción natural de colágeno 😊

💫 Ayuda a mejorar:
• Arrugas finas y profundas
• Manchas
• Cicatrices de acné
• Textura de la piel
• Poros dilatados
• Flacidez leve

✨ La piel se ve más firme, uniforme y rejuvenecida progresivamente 🙌

📌 Trabajamos distintas intensidades según cada caso, por eso es fundamental realizar una evaluación previa para poder indicarte el protocolo adecuado y brindarte un presupuesto personalizado 😊`,

  drenaje: `✨ Drenajes Linfáticos ✨

Es un tratamiento corporal que ayuda a estimular el sistema linfático, favoreciendo la eliminación de líquidos y toxinas acumuladas 😊

💫 Ayuda muchísimo a:
• Disminuir retención de líquidos
• Reducir inflamación y edemas
• Mejorar circulación
• Desinflamar piernas y abdomen
• Complementar tratamientos corporales y post operatorios

✨ También es muy indicado en pacientes que se realizaron procedimientos estéticos, ya que ayuda a acelerar la recuperación y mejorar resultados 🙌

💵 Valor por sesión: $65.000
💵 Pack 4 sesiones: $210.000

📌 Pacientes MELA cuentan con valores especiales indicados por la doctora 😊`,

  dermosculpt: `✨ Dermosculpt ✨

Es un tratamiento corporal con tecnología de electroestimulación que genera contracciones musculares controladas para tonificar y modelar el cuerpo 😊

💫 Ayuda a:
• Tonificar músculos
• Mejorar flacidez
• Modelar la figura
• Favorecer circulación
• Complementar tratamientos reductores

✨ Es ideal para trabajar abdomen, glúteos, piernas y distintas zonas corporales de manera no invasiva 🙌

📅 Generalmente se indican 3 sesiones semanales para lograr mejores resultados.

💵 Pack 12 sesiones: $250.000 ✨`,

  geneo: `✨ Geneo Corporal + Peeling y Pulido Corporal ✨

💫 Geneo Corporal
Es un tratamiento no invasivo que combina exfoliación, oxigenación e hidratación profunda para mejorar la calidad de la piel corporal 😊
✨ Ayuda a mejorar textura, aportar luminosidad, hidratar profundamente, unificar el tono y complementar tratamientos corporales.
💵 1 sesión: $350.000
💵 3 sesiones: $785.000

💫 Peeling Corporal
Ayuda a renovar la piel, mejorar manchas, textura y suavidad 🙌
💵 1 sesión: $75.000 por zona
💵 4 sesiones: $250.000

💫 Pulido Corporal
Exfoliación profunda que deja la piel mucho más suave, luminosa y uniforme 😊
💵 Valor por sesión: $105.000`,

  consulta: `✨ El beneficio de la consulta con la Doctora es evaluar tus necesidades en detalle, responder todas tus dudas e inquietudes y orientarte para decidir qué procedimiento es el indicado para vos.

📌 Recibimos obras sociales colegiadas para la consulta (excepto Galeno Boreal y OSDE) + $15.000 por única vez.

La consulta particular tiene un precio de $20.000, que se abona por única vez.

💳 Medios de pago disponibles ✨
Trabajamos con:
• Efectivo
• Transferencia
• Tarjetas de débito
• Tarjetas de crédito

📌 Las tarjetas de crédito cuentan con recargo:
• 1 a 3 cuotas → 15%
• 6 cuotas → 25%`,
};


// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type Env = {
  SofiaAgent: DurableObjectNamespace;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  CHATWOOT_API_URL: string;
  CHATWOOT_API_TOKEN: string;
  CHATWOOT_ACCOUNT_ID: string;
  CHATWOOT_INBOX_ID: string;
  CHATWOOT_LABEL_DERIVADO: string;
  CHATWOOT_ATTR_IA_ACTIVA: string;
};

type Message = { role: "user" | "assistant"; content: string };

type ConvState = {
  conversationId: number;
  contactId: number;
  channel: "whatsapp" | "instagram" | "other";
  history: Message[];
  pendingChunks: string[];
  timerActive: boolean;
  derivado: boolean;
};

// ─────────────────────────────────────────────
// DURABLE OBJECT
// ─────────────────────────────────────────────

export class SofiaConversation implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private convData: ConvState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async load(): Promise<ConvState | null> {
    if (this.convData) return this.convData;
    this.convData = (await this.state.storage.get<ConvState>("conv")) ?? null;
    return this.convData;
  }

  private async save(data: ConvState) {
    this.convData = data;
    await this.state.storage.put("conv", data);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/message" && req.method === "POST") {
      const body = await req.json<{
        conversationId: number;
        contactId: number;
        channel: string;
        text: string;
      }>();
      return this.handleIncomingMessage(body);
    }
    return new Response("ok", { status: 200 });
  }

  private async handleIncomingMessage(msg: {
    conversationId: number;
    contactId: number;
    channel: string;
    text: string;
  }): Promise<Response> {
    let conv = await this.load();

    if (!conv) {
      conv = {
        conversationId: msg.conversationId,
        contactId: msg.contactId,
        channel: msg.channel === "instagram" ? "instagram" : msg.channel === "whatsapp" ? "whatsapp" : "other",
        history: [],
        pendingChunks: [],
        timerActive: false,
        derivado: false,
      };
    }

    // RESET silencioso
    if (msg.text.trim().toUpperCase() === "RESET") {
      conv.history = [];
      conv.pendingChunks = [];
      conv.derivado = false;
      await this.save(conv);
      return Response.json({ ok: true, status: "reset" });
    }

    if (conv.derivado) return Response.json({ ok: true, skipped: "already_derived" });

    conv.pendingChunks.push(msg.text.trim());
    const alarmTime = Date.now() + TIMER_MS;
    await this.state.storage.setAlarm(alarmTime);
    conv.timerActive = true;
    console.log(`[SOFIA] chunk guardado, alarm seteado para +${TIMER_MS}ms, conv=${msg.conversationId}`);

    await this.save(conv);
    return Response.json({ ok: true, status: "chunk_queued" });
  }

  async alarm(): Promise<void> {
    console.log("[SOFIA] alarm() disparado");
    const conv = await this.load();
    console.log(`[SOFIA] conv cargado: ${conv ? `chunks=${conv.pendingChunks.length}` : "null"}`);
    if (!conv || conv.pendingChunks.length === 0) return;

    const userMessage = conv.pendingChunks.join(" ").trim();
    conv.pendingChunks = [];
    conv.timerActive = false;

    conv.history.push({ role: "user", content: userMessage });
    if (conv.history.length > MAX_HISTORY_MESSAGES * 2) {
      conv.history = conv.history.slice(-(MAX_HISTORY_MESSAGES * 2));
    }

    const openai = new OpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const model = this.env.OPENAI_MODEL || "gpt-4.1";

    const messagesForApi: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conv.history.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
    ];

    // Fecha al final del último user message (no rompe cache del system prompt)
    const lastMsg = messagesForApi[messagesForApi.length - 1];
    if (lastMsg?.role === "user") {
      const fecha = new Date().toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      });
      lastMsg.content = `${lastMsg.content}\n\n[Fecha actual: ${fecha}]`;
    }

    let aiResponse = "";
    let shouldDerivar = false;

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: messagesForApi,
        temperature: 0.7,
        max_tokens: 600,
      });
      aiResponse = completion.choices[0]?.message?.content ?? "";

      if (aiResponse.includes("[[DERIVAR]]")) {
        shouldDerivar = true;
        aiResponse = aiResponse.replace("[[DERIVAR]]", "").trim();
      }
    } catch (err) {
      console.error("OpenAI error:", err);
      return;
    }

    // Reemplazar [[TRATAMIENTO:clave]] por el texto fijo
    aiResponse = aiResponse.replace(/\[\[TRATAMIENTO:(\w+)\]\]/g, (_match, clave) => {
      return TRATAMIENTOS[clave] ?? `(info de ${clave} no disponible)`;
    });

    conv.history.push({ role: "assistant", content: aiResponse });

    // Enviar partes (separadas por ---MENSAJE---)
    const parts = aiResponse.split("---MENSAJE---").map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      await this.sendChatwootMessage(conv.conversationId, part);
    }

    if (shouldDerivar && !conv.derivado) {
      conv.derivado = true;
      await this.derivarConversacion(conv.conversationId, conv.contactId);
    }

    await this.save(conv);
  }

  private async sendChatwootMessage(conversationId: number, content: string): Promise<void> {
    const url = `${this.env.CHATWOOT_API_URL}/api/v1/accounts/${this.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_access_token": this.env.CHATWOOT_API_TOKEN,
      },
      body: JSON.stringify({ content, message_type: "outgoing", private: false }),
    });
  }

  private async derivarConversacion(conversationId: number, contactId: number): Promise<void> {
    const base = `${this.env.CHATWOOT_API_URL}/api/v1/accounts/${this.env.CHATWOOT_ACCOUNT_ID}`;
    const headers = {
      "Content-Type": "application/json",
      "api_access_token": this.env.CHATWOOT_API_TOKEN,
    };
    await fetch(`${base}/conversations/${conversationId}/labels`, {
      method: "POST",
      headers,
      body: JSON.stringify({ labels: [this.env.CHATWOOT_LABEL_DERIVADO] }),
    });
    await fetch(`${base}/contacts/${contactId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        custom_attributes: { bot: "off" },
      }),
    });
  }
}

// ─────────────────────────────────────────────
// WORKER RAÍZ
// ─────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/" && req.method === "GET") {
      return new Response("Sofia — agente Dra. Luz Herrera", { status: 200 });
    }
    if (url.pathname === "/webhook" && req.method === "POST") {
      return handleChatwootWebhook(req, env);
    }
    return new Response("not found", { status: 404 });
  },
};

// ─────────────────────────────────────────────
// WEBHOOK HANDLER
// ─────────────────────────────────────────────

async function handleChatwootWebhook(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  console.log(`[SOFIA] webhook: event=${body.event} type=${body.message_type} inbox=${(body.inbox as Record<string,unknown>)?.id}`);
  if (body.event !== "message_created") return Response.json({ ok: true, skipped: "not_message_created" });
  // Chatwoot envía message_type como número: 0=incoming, 1=outgoing, 2=activity
  if (body.message_type !== "incoming" && body.message_type !== 0) {
    return Response.json({ ok: true, skipped: "not_incoming" });
  }

  const content = (body.content as string) ?? "";
  if (!content.trim()) return Response.json({ ok: true, skipped: "empty_content" });

  const inboxId = String((body.inbox as Record<string, unknown>)?.id ?? "");
  if (inboxId && inboxId !== env.CHATWOOT_INBOX_ID) {
    return Response.json({ ok: true, skipped: `inbox_${inboxId}_not_monitored` });
  }

  const conversationId = (body.conversation as { id: number })?.id;
  const contactId = (body.sender as { id: number })?.id;
  if (!conversationId || !contactId) {
    return Response.json({ ok: false, error: "missing_ids" }, { status: 400 });
  }

  // El campo de control es custom_attributes.bot: "on" = activa, "off" = apagada, ausente = activa
  const customAttrs = (body.sender as Record<string, unknown>)?.custom_attributes as Record<string, unknown> | undefined;
  const botStatus = customAttrs?.["bot"];
  if (botStatus === "off") {
    return Response.json({ ok: true, skipped: "ia_desactivada" });
  }

  const inboxChannel = ((body.inbox as Record<string, unknown>)?.channel_type as string) ?? "";
  let channel: "whatsapp" | "instagram" | "other" = "other";
  if (inboxChannel.toLowerCase().includes("whatsapp")) channel = "whatsapp";
  if (inboxChannel.toLowerCase().includes("instagram")) channel = "instagram";

  const doId = env.SofiaAgent.idFromName(`conv-${conversationId}`);
  const stub = env.SofiaAgent.get(doId);

  return stub.fetch(
    new Request("https://sofia.internal/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, contactId, channel, text: content }),
    })
  );
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT — ESTÁTICO (prompt caching)
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `Sos Sofía, asistente virtual de la Dra. Luz Herrera, médica especialista en medicina estética. Consultorios en Salta y Tucumán, Argentina.

## Personalidad
- Hablás como una chica argentina de 22 años: cálida, natural, directa.
- No usás muletillas exageradas. Sí podés decir "bueno", "dale", "genial".
- No usás signos de apertura (¡ ¿). Solo los de cierre (! ?).
- Nunca decís que sos IA salvo que te lo pregunten directamente.

## Respuestas
- 1 a 3 mensajes por turno según corresponda.
- Si mandás más de uno, separá con "---MENSAJE---" exacto.
- Mensajes cortos y naturales, como WhatsApp.

## Proceso de atención

**PASO 1 — Saludo**
Si es el primer mensaje de la conversación (history vacío o solo ese mensaje), presentate siempre como Sofía, asistente de la Dra. Luz Herrera, y pedí el nombre.
- Si solo saludaron ("hola", "buenas"): presentate y pedí el nombre.
- Si ya preguntaron algo ("cuánto sale el botox"): presentate, respondé lo que preguntaron Y pedí el nombre al final.
- Nunca omitas presentarte en el primer turno.

**PASO 2 — Qué le interesa**
Preguntá qué tratamiento busca.
Cuando lo diga, respondé con: [[TRATAMIENTO:clave]]
Claves disponibles:
- limpieza → limpieza facial profunda
- botox → botox / toxina botulínica
- rinomodelacion → rinomodelación con ácido hialurónico
- armonizacion → armonización facial
- labios → labios con ácido hialurónico
- sculptra → sculptra bioestimulador
- mela → MELA láser
- endymed_corporal → endymed corporal
- endymed_facial → endymed facial
- prp → plasma rico en plaquetas
- dermapen → dermapen con exosomas
- hifu → HIFU facial
- dermaplaning → dermaplaning
- laser_co2 → láser CO2
- drenaje → drenajes linfáticos
- dermosculpt → dermosculpt
- geneo → geneo + peeling + pulido corporal
- consulta → info de consulta médica

Si pide algo que no está en la lista, preguntá más detalles o sugerí lo más cercano.

**PASO 3 — Ubicación**
Preguntá si está en Salta o Tucumán (o de dónde nos contacta).

- **Salta:** SOLO consultas e inyectables (Botox, rellenos, rinomodelación, profhilo). NO se hace aparatología, NO se hace plasma. Días: sábados, a coordinar con la Dra.
- **Tucumán Barrio Norte** (Monteagudo 639, CINEA): consultas + inyectables + cosmetología SIN aparatología. Horarios: Lunes 17-20hs, Martes 10-13hs, Jueves 17-20hs.
- **Tucumán Yerba Buena** (Av. Aconquija 688): todo lo anterior + aparatología completa. Horarios: Lunes y Jueves 10-16hs, Martes y Miércoles 15-19hs, Viernes 10-19hs, Sábado 9-15hs.

**PASO 4 — Turno / Precio consulta**
- Salta: consulta GRATIS con la Dra. Fechas a coordinar (próximas: 13 y 20). Miranda le pasa la fecha.
- Tucumán: consulta $20.000 particular / obras sociales colegiadas + $15.000 (excepto Galeno Boreal y OSDE).

**PASO 5 — Derivar**
Derivar SOLO cuando la persona confirme explícitamente que quiere sacar turno (ej: "sí quiero", "dale", "me anoto", "quiero turno", "cómo saco turno").
NO derivar si solo pregunta precios, horarios o muestra interés general.
Cuando confirme, respondé con algo como "Perfecto! Ya te digo qué horario queda disponible." y al final agregá exactamente [[DERIVAR]].
El mensaje tiene que ser corto y natural, sin despedirte ni cerrar la conversación.

## Restricciones
- Tratamientos corporales: SOLO pacientes femeninas.
- Botox, armonización facial, full face, rellenos: SOLO los realiza la Dra. Herrera. El staff NO los hace.
- Staff: sin cargo la consulta, NO hacen inyectables.
- No prometés resultados específicos ni dás diagnósticos.
- No agendás turnos directamente.`;
