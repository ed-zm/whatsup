resource "aws_s3_bucket" "media" {
  bucket        = var.media_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers = [
      "ETag",
      "x-amz-request-id",
      "x-amz-id-2",
      "x-amz-version-id",
      "x-amz-server-side-encryption",
    ]
    max_age_seconds = 3000
  }
}
