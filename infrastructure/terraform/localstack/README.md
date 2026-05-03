# LocalStack Terraform

Terraform project for provisioning local cloud resources against LocalStack at `http://localhost:4566`.

## Prerequisites

Start LocalStack before running Terraform:

```sh
docker compose up -d localstack
```

Export dummy AWS credentials in the same terminal session. This keeps Terraform and the AWS provider from using real credentials from `~/.aws/credentials`.

```sh
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_EC2_METADATA_DISABLED=true
unset AWS_PROFILE
```

## Run Terraform

```sh
cd infrastructure/terraform/localstack
terraform init
terraform plan
terraform apply
```

To override defaults:

```sh
terraform apply \
  -var="media_bucket_name=whatsapp-media-local" \
  -var="localstack_endpoint=http://localhost:4566"
```

## Verify

```sh
aws --endpoint-url=http://localhost:4566 s3api get-bucket-cors --bucket whatsapp-media-local
aws --endpoint-url=http://localhost:4566 s3 ls s3://whatsapp-media-local
```

If this bucket was created previously by the old LocalStack bootstrap script, either reset the LocalStack volume or import it into state before applying:

```sh
terraform import aws_s3_bucket.media whatsapp-media-local
```
