# Kafka Topics

Kafka desacopla persistencia, entrega en tiempo real, notificaciones y observabilidad. Las claves de partición deben preservar orden donde importa.

| Topic | Producer | Consumers | Partition Key | Purpose |
| --- | --- | --- | --- | --- |
| `messages.inbound.v1` | `messaging-service` REST controller | `messaging-service` persistence worker | `conversationId` | Mensajes aceptados por API y pendientes de persistencia. |
| `messages.persisted.v1` | `messaging-service` persistence worker | `realtime-gateway`, notification workers | `conversationId` | Mensajes ya escritos en Cassandra y listos para entrega. |
| `messages.delivery-status.v1` | `realtime-gateway`, clients via REST | `messaging-service` status worker | `messageId` | Estados `sent`, `delivered`, `read`, `failed`. |
| `users.presence.v1` | `realtime-gateway` | `users-service`, analytics workers | `userId` | Cambios de presencia y `lastSeenAt`. |
| `auth.otp-requested.v1` | `auth-service` | SMS provider worker, audit workers | `phoneNumber` | Solicitudes de OTP aceptadas tras rate-limiting. |
| `auth.otp-verified.v1` | `auth-service` | `users-service`, audit workers | `phoneNumber` | Verificaciones de teléfono exitosas. |

## Topic Defaults

- Replication factor: `3` en ambientes productivos.
- Minimum in-sync replicas: `2`.
- Retention:
  - Mensajes y delivery status: 7 dias iniciales.
  - Eventos de auth y presencia: 3 dias iniciales.
- Versionado: todo topic estable incluye sufijo `.v1`; cambios incompatibles publican nuevo topic.

## Message Ordering

- El orden de conversación depende de particionar por `conversationId`.
- El orden global no es requisito del producto.
- El consumidor debe ser idempotente usando `messageId` o `eventId`.
