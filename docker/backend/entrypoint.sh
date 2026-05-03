#!/bin/sh
set -eu

cd "${SERVICE_DIR:-/app/service}"

if [ ! -d node_modules ]; then
  npm ci
fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  npm run migrate
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec sh -c "${START_COMMAND:-npm run dev}"
