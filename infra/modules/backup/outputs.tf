output "terraform_state_bucket_name" {
  description = "Name of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_bucket_arn" {
  description = "ARN of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.arn
}

output "bucket_name" {
  description = "Name of the database backup bucket"
  value       = aws_s3_bucket.database_backups.id
}

output "bucket_arn" {
  description = "ARN of the database backup bucket"
  value       = aws_s3_bucket.database_backups.arn
}

output "backup_role_arn" {
  description = "ARN of the backup IAM role"
  value       = aws_iam_role.backup_role.arn
}

output "backup_log_group_name" {
  description = "CloudWatch log group for backup logs"
  value       = aws_cloudwatch_log_group.backup_logs.name
}

output "notification_topic_arn" {
  description = "SNS topic for backup notifications"
  value       = aws_sns_topic.backup_notifications.arn
}

output "retention_days" {
  description = "Backup retention period in days"
  value       = var.backup_retention_days
}
