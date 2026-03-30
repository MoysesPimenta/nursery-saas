variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nursery-saas"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
}

variable "supabase_access_token" {
  description = "Supabase API access token"
  type        = string
  sensitive   = true
}

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region for backup infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "supabase_organization_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "supabase_db_password" {
  description = "Supabase database password"
  type        = string
  sensitive   = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_waf" {
  description = "Enable Cloudflare WAF rules"
  type        = bool
  default     = true
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting on Cloudflare"
  type        = bool
  default     = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "nursery-saas"
    ManagedBy   = "terraform"
    CreatedDate = "2026-03-30"
  }
}
