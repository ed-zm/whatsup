# Local Development Environment

## Start The Stack

```sh
docker compose up --build
```

Kafka UI is available at http://localhost:8090.

Provision LocalStack resources with Terraform after LocalStack is healthy:

```sh
cd infrastructure/terraform/localstack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_EC2_METADATA_DISABLED=true
unset AWS_PROFILE
terraform init
terraform apply
```

## Hardened Images

The base compose file uses Docker Official Images where possible:

- `postgres:16-alpine`
- `cassandra:5.0`
- `redis:7.4-alpine`
- `apache/kafka:4.2.0`
- `node:22-alpine`

Kafka UI does not have a Docker Official Image, so it remains on the upstream community image. LocalStack uses the upstream vendor image by default.

To use Docker Hardened Images where the DHI catalog has a compatible image, authenticate first:

```sh
docker login dhi.io
```

Then start with the hardened overlay:

```sh
docker compose -f docker-compose.yml -f docker-compose.hardened.yml up --build
```

The hardened overlay swaps Node, PostgreSQL, Redis, Kafka, and LocalStack to `dhi.io` images. Cassandra remains on the Docker Official Image because the DHI catalog does not currently expose a direct single-node Cassandra replacement.

## Smoke Tests

Verify PostgreSQL migrations applied:

```sh
docker compose exec postgres psql -U whatsup -d whatsup -c "SELECT id, name, run_on FROM pgmigrations ORDER BY id;"
```

Verify PostgreSQL identity tables exist:

```sh
docker compose exec postgres psql -U whatsup -d whatsup -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'roles', 'permissions', 'user_roles', 'user_push_tokens') ORDER BY table_name;"
```

Verify Cassandra keyspace exists:

```sh
docker compose exec cassandra cqlsh -e "SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'whatsup_messages';"
```

Verify Cassandra messages table exists:

```sh
docker compose exec cassandra cqlsh -e "DESCRIBE TABLE whatsup_messages.messages_by_conversation_day;"
```

Verify LocalStack S3 bucket exists:

```sh
docker compose exec localstack awslocal s3api head-bucket --bucket whatsapp-media-local
```

Verify the WebSocket gateway HTTP probe responds:

```sh
curl http://localhost:3002
```
