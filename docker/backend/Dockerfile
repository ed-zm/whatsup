ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE}

ARG SERVICE_PATH

WORKDIR /app/service

COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY ${SERVICE_PATH}/package*.json ./
RUN npm ci

COPY ${SERVICE_PATH}/ ./

EXPOSE 3001 3002 3003

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
