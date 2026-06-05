# Chatwoot — Formato del Webhook

Chatwoot envía un POST a la URL configurada cada vez que ocurre un evento.
El evento relevante para agentes es `message_created`.

## Campos clave

```
body.event                          → "message_created"
body.message_type                   → "incoming" (usuario) | "outgoing" (bot/agente)
body.content                        → texto del mensaje
body.inbox.id                       → ID del inbox (filtrar para solo responder al correcto)
body.inbox.name                     → nombre del inbox
body.conversation.id                → ID de la conversación (para responder y etiquetar)
body.sender.id                      → ID del contacto (para modificar atributos)
body.sender.name                    → nombre del contacto
body.sender.phone_number            → teléfono
body.sender.custom_attributes.bot   → "on" | "off" | ausente (control de IA)
body.sender.additional_attributes   → otros atributos del contacto (no usar para control de IA)
```

## JSON de ejemplo real (inbox WhatsApp via WAHA)

```json
{
  "event": "message_created",
  "message_type": "incoming",
  "content": "Hola",
  "id": 171604,
  "created_at": "2026-06-04T18:49:07.596Z",
  "account": { "id": 1, "name": "Qyra Solutions" },
  "inbox": { "id": 29, "name": "Numero prueba" },
  "conversation": {
    "id": 2272,
    "inbox_id": 29,
    "channel": "Channel::Api",
    "status": "open",
    "contact_inbox": {
      "id": 13764,
      "contact_id": 2,
      "inbox_id": 29,
      "source_id": "777338b7-0948-4500-908c-959249f847ad"
    }
  },
  "sender": {
    "id": 2,
    "name": "Ivan Gavilan",
    "phone_number": "+5491170073956",
    "identifier": "5491170073956@s.whatsapp.net",
    "custom_attributes": {
      "bot": "on",
      "waha_whatsapp_jid": "5491170073956@c.us",
      "waha_whatsapp_chat_id": "186766686433409@lid"
    },
    "additional_attributes": {
      "ia_activa": false
    },
    "blocked": false
  }
}
```

## Control on/off de la IA

El campo que manda es `sender.custom_attributes.bot`:

```typescript
const botStatus = body.sender?.custom_attributes?.bot;
if (botStatus === "off") return; // ignorar, no responder
// "on" o ausente → responder normalmente
```

**NO usar** `additional_attributes.ia_activa` — ese campo puede estar desactualizado.

## Responder a una conversación

```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
Headers: api_access_token: TOKEN
Body: { "content": "texto", "message_type": "outgoing", "private": false }
```

## Etiquetar conversación

```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/labels
Headers: api_access_token: TOKEN
Body: { "labels": ["derivado"] }
```

## Apagar IA para un contacto (derivación)

```
PATCH /api/v1/accounts/{account_id}/contacts/{contact_id}
Headers: api_access_token: TOKEN
Body: { "custom_attributes": { "bot": "off" } }
```

## Filtro de inbox recomendado

Siempre filtrar por `inbox.id` para que el agente solo responda al canal correcto:

```typescript
const inboxId = String(body.inbox?.id ?? "");
if (inboxId !== env.CHATWOOT_INBOX_ID) return; // ignorar otros inboxes
```
