variable "project_name" {
  description = "Project name for Supabase project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "organization_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Supabase region"
  type        = string
  default     = "us-east-1"
}

variable "enable_rls" {
  description = "Enable Row-Level Security on all tables"
  type        = bool
  default     = true
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
