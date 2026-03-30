# Backup Module - AWS S3 for state and database backups

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-tfstate-${var.environment}"

  tags = merge(
    var.tags,
    {
      Purpose = "terraform-state"
    }
  )
}

# Enable versioning for state protection
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Database Backups
resource "aws_s3_bucket" "database_backups" {
  bucket = "${var.project_name}-backups-${var.environment}"

  tags = merge(
    var.tags,
    {
      Purpose = "database-backups"
    }
  )
}

# Versioning for backups
resource "aws_s3_bucket_versioning" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for backups
resource "aws_s3_bucket_server_side_encryption_configuration" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy for automatic backup cleanup
resource "aws_s3_bucket_lifecycle_configuration" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }
  }
}

# Block public access to backups
resource "aws_s3_bucket_public_access_block" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for backup operations
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "rds.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Purpose = "backup-operations"
    }
  )
}

# IAM Policy for S3 access
resource "aws_iam_role_policy" "backup_s3_policy" {
  name = "${var.project_name}-backup-s3-policy"
  role = aws_iam_role.backup_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.database_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.database_backups.arn
        ]
      }
    ]
  })
}

# CloudWatch Log Group for backup monitoring
resource "aws_cloudwatch_log_group" "backup_logs" {
  name              = "/aws/backup/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = merge(
    var.tags,
    {
      Purpose = "backup-logs"
    }
  )
}

# SNS Topic for backup notifications
resource "aws_sns_topic" "backup_notifications" {
  name = "${var.project_name}-backup-notifications-${var.environment}"

  tags = merge(
    var.tags,
    {
      Purpose = "backup-notifications"
    }
  )
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "backup_notifications" {
  arn = aws_sns_topic.backup_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.backup_notifications.arn
      }
    ]
  })
}
