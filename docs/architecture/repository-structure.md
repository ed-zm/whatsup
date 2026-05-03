# Backend Repository Structure

Este repositorio se organiza como un monorepo de microservicios. Cada servicio mantiene las capas de Clean Architecture separadas por responsabilidad y no debe depender de detalles de infraestructura desde el dominio o los casos de uso.

```text
whatsup/
├── services/
│   ├── auth-service/
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   ├── value-objects/
│   │       │   └── repositories/
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   ├── dto/
│   │       │   └── ports/
│   │       ├── adapters/
│   │       │   └── http/
│   │       │       ├── controllers/
│   │       │       ├── middlewares/
│   │       │       └── routes/
│   │       └── infrastructure/
│   │           ├── persistence/
│   │           │   └── postgres/
│   │           ├── cache/
│   │           │   └── redis/
│   │           ├── messaging/
│   │           │   └── kafka/
│   │           └── config/
│   ├── users-service/
│   │   └── src/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── adapters/
│   │       └── infrastructure/
│   ├── contacts-service/
│   │   └── src/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── adapters/
│   │       └── infrastructure/
│   ├── messaging-service/
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   ├── value-objects/
│   │       │   └── repositories/
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   ├── dto/
│   │       │   └── ports/
│   │       ├── adapters/
│   │       │   └── http/
│   │       │       ├── controllers/
│   │       │       ├── middlewares/
│   │       │       └── routes/
│   │       └── infrastructure/
│   │           ├── persistence/
│   │           │   └── cassandra/
│   │           ├── cache/
│   │           │   └── redis/
│   │           ├── messaging/
│   │           │   └── kafka/
│   │           └── config/
│   └── realtime-gateway/
│       └── src/
│           ├── domain/
│           ├── application/
│           ├── adapters/
│           │   └── http/
│           │       ├── controllers/
│           │       ├── middlewares/
│           │       └── routes/
│           └── infrastructure/
│               ├── cache/
│               │   └── redis/
│               ├── messaging/
│               │   └── kafka/
│               └── config/
├── shared/
│   └── contracts/
│       └── src/
│           ├── messaging/
│           └── http/
├── database/
│   ├── cassandra/
│   └── postgresql/
└── docs/
    ├── architecture/
    └── infrastructure/
```

## Dependency Rule

- `domain` contiene entidades, value objects e interfaces de repositorios. No importa frameworks, drivers ni clientes externos.
- `application` contiene casos de uso, DTOs y puertos de entrada/salida. Puede depender de `domain`, pero no de `infrastructure`.
- `adapters` traduce REST HTTP hacia casos de uso. Aquí viven controllers, middlewares y routes.
- `infrastructure` implementa puertos con drivers concretos: `pg`, `cassandra-driver`, clientes Redis y productores/consumidores Kafka.
- `shared/contracts` publica tipos y contratos estables entre servicios, sin lógica de negocio ni dependencias de infraestructura.

## Microservice Ownership

- `auth-service`: registro por SMS, OTP, autenticación, roles y permisos.
- `users-service`: perfil de usuario y estado público.
- `contacts-service`: agenda, relaciones de contacto y bloqueos futuros.
- `messaging-service`: persistencia y publicación de mensajes.
- `realtime-gateway`: presencia WebSocket, fan-out en tiempo real y routing a nodos conectados.

## Database Access Rule

No se permiten ORMs. Toda persistencia debe ejecutarse con consultas SQL/CQL crudas usando drivers oficiales o clientes de bajo nivel, por ejemplo `pg` para PostgreSQL y `cassandra-driver` para Cassandra.
