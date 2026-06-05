# Optimizaciones de costo — OpenAI

Aplicar SIEMPRE en todos los agentes de Ivan para mantener el costo bajo sin sacrificar calidad.

## 1. Prompt caching (50% descuento en tokens de input)

OpenAI cachea automáticamente el prefijo del contexto si se repite idéntico entre llamadas.

**Regla crítica:** el system prompt debe ser una **constante estática**. Ni una sola variable dinámica.

```typescript
// ✅ CORRECTO — cacheable
const SYSTEM_PROMPT = `Sos Sofía, asistente de la Dra. Luz Herrera...`;

// ❌ INCORRECTO — rompe el cache, duplica el costo
function buildSystemPrompt() {
  return `Fecha: ${new Date().toISOString()} Sos Sofía...`;
}
```

**Fecha u otro dato dinámico:** agregarlos al FINAL del último mensaje del usuario, no al system prompt.

```typescript
lastMsg.content = `${lastMsg.content}\n\n[Fecha: ${fecha}]`;
```

## 2. System prompt comprimido

- Una sola sección por tema (no duplicar info)
- Reglas en formato lista corta, no párrafos
- Sin ejemplos verbosos repetidos
- Objetivo: menos de 2000 tokens para el system prompt

## 3. Historial limitado

```typescript
const MAX_HISTORY_MESSAGES = 10; // turnos (user + assistant)

if (conv.history.length > MAX_HISTORY_MESSAGES * 2) {
  conv.history = conv.history.slice(-(MAX_HISTORY_MESSAGES * 2));
}
```

## 4. max_tokens acotado

```typescript
max_tokens: 600  // suficiente para 1-3 mensajes de WhatsApp
```

## 5. Modelo recomendado

| Modelo | Cuándo usarlo |
|---|---|
| `gpt-4.1` | Default — buen balance calidad/costo |
| `gpt-4.1-mini` | Si se acepta menos calidad (4x más barato) |
| `gpt-4o-mini` | Casos muy simples (15x más barato) |

## 6. Configuración en wrangler.jsonc

```jsonc
"vars": {
  "OPENAI_MODEL": "gpt-4.1"
}
```

El modelo va como variable de entorno para poder cambiarlo sin tocar código.

## Checklist antes de deployar

- [ ] `SYSTEM_PROMPT` es una constante (no función)
- [ ] No hay fechas/timestamps en el system prompt
- [ ] `MAX_HISTORY_MESSAGES` ≤ 10
- [ ] `max_tokens` ≤ 800
- [ ] Modelo definido en `wrangler.jsonc`
