variable "aws_region" {
  description = "AWS region used by LocalStack."
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key_id" {
  description = "Dummy AWS access key for LocalStack."
  type        = string
  default     = "test"
}

variable "aws_secret_access_key" {
  description = "Dummy AWS secret key for LocalStack."
  type        = string
  default     = "test"
  sensitive   = true
}

variable "localstack_endpoint" {
  description = "Base endpoint for LocalStack services."
  type        = string
  default     = "http://localhost:4566"
}

variable "media_bucket_name" {
  description = "S3 bucket name for WhatsApp media uploads."
  type        = string
  default     = "whatsapp-media-local"
}
