output "media_bucket_arn" {
  description = "ARN of the LocalStack S3 media bucket."
  value       = aws_s3_bucket.media.arn
}

output "media_bucket_object_base_url" {
  description = "Path-style base URL for objects in the LocalStack media bucket."
  value       = "${trimsuffix(var.localstack_endpoint, "/")}/${aws_s3_bucket.media.bucket}"
}
