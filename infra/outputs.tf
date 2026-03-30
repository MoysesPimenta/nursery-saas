output "supabase_url" {
  description = "Supabase project API URL"
  value       = module.supabase.project_url
}

output "supabase_anon_key" {
  description = "Supabase anonymous key (public)"
  value       = module.supabase.anon_key
}

output "supabase_service_role_key" {
  description = "Supabase service role key (secret)"
  value       = module.supabase.service_role_key
  sensitive   = true
}

output "vercel_project_url" {
  description = "Vercel project deployment URL"
  value       = module.vercel.project_url
}

output "vercel_preview_url_template" {
  description = "Template for Vercel preview deployment URLs"
  value       = module.vercel.preview_url_template
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = module.cloudflare.zone_id
}

output "cloudflare_nameservers" {
  description = "Cloudflare nameservers for domain delegation"
  value       = module.cloudflare.nameservers
}

output "backup_bucket_name" {
  description = "AWS S3 bucket for backups"
  value       = module.backup.bucket_name
}

output "backup_bucket_arn" {
  description = "ARN of backup S3 bucket"
  value       = module.backup.bucket_arn
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "domain_name" {
  description = "Application domain name"
  value       = var.domain_name
}
