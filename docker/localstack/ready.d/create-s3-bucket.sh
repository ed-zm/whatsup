#!/bin/sh
set -eu

BUCKET_NAME="${S3_BUCKET_NAME:-whatsapp-media-local}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

if [ "${MANAGE_INFRA_WITH_TERRAFORM:-false}" = "true" ]; then
  echo "Skipping LocalStack S3 bootstrap; infrastructure is managed by Terraform."
  exit 0
fi

awslocal s3api create-bucket \
  --bucket "${BUCKET_NAME}" \
  --region "${REGION}" >/dev/null 2>&1 || true

awslocal s3api put-bucket-versioning \
  --bucket "${BUCKET_NAME}" \
  --versioning-configuration Status=Enabled

echo "LocalStack S3 bucket ready: ${BUCKET_NAME}"
