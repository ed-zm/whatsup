# Redis Structures

Redis se usa para estado efímero: routing de conexiones WebSocket y rate-limiting de SMS. La fuente de verdad durable permanece en PostgreSQL, Cassandra y Kafka.

## WebSocket Node Routing

```text
ws:node:{nodeId}
type: HASH
fields:
  nodeId: string
  region: string
  host: string
  port: number
  startedAt: unix_ms
  lastHeartbeatAt: unix_ms
  activeConnections: number
ttl: 30 seconds
```

```text
ws:nodes:active
type: SET
members: nodeId
ttl: none
cleanup: remover nodeId cuando ws:node:{nodeId} expire o falle heartbeat
```

```text
ws:user:{userId}:connections
type: SET
members: {nodeId}:{connectionId}
ttl: 24 hours, renovado por heartbeat de conexión
```

```text
ws:connection:{connectionId}
type: HASH
fields:
  connectionId: string
  userId: uuid
  nodeId: string
  deviceId: string
  connectedAt: unix_ms
  lastSeenAt: unix_ms
ttl: 24 hours, renovado por heartbeat de conexión
```

Uso esperado:
- El `realtime-gateway` registra `ws:node:{nodeId}` en cada heartbeat.
- Al conectar un usuario, agrega `{nodeId}:{connectionId}` a `ws:user:{userId}:connections`.
- Para entregar un mensaje en tiempo real, el consumidor Kafka consulta `ws:user:{userId}:connections` y enruta hacia los nodos activos.

## SMS Rate Limiting

```text
sms:rate:phone:{phoneNumber}:minute
type: STRING counter
operation: INCR
ttl: 60 seconds
limit: 1 OTP por minuto por telefono
```

```text
sms:rate:phone:{phoneNumber}:day
type: STRING counter
operation: INCR
ttl: 24 hours
limit: 5 OTP por dia por telefono
```

```text
sms:rate:ip:{ipAddress}:hour
type: STRING counter
operation: INCR
ttl: 1 hour
limit: 20 OTP por hora por IP
```

```text
sms:otp:lock:{phoneNumber}
type: STRING
value: reason
ttl: configurable, por ejemplo 15 minutes
```

Regla de atomicidad:
- Las operaciones de incremento, expiración y validación de límite deben ejecutarse en una transacción Lua o comando equivalente atómico.
- Redis solo bloquea abuso en caliente; el historial verificable de OTP vive en `otp_verifications`.
