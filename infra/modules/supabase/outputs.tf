output "project_id" {
  description = "Supabase project ID"
  value       = "supabase-project-${var.environment}"
}

output "project_url" {
  description = "Supabase project API URL"
  value       = "https://${var.project_name}-${var.environment}.supabase.co"
}

output "anon_key" {
  description = "Supabase anonymous key (public)"
  value       = "anon-key-placeholder"
  # Note: Retrieve actual key from Supabase dashboard or API
}

output "service_role_key" {
  description = "Supabase service role key (secret)"
  value       = "service-role-key-placeholder"
  sensitive   = true
  # Note: Retrieve actual key from Supabase dashboard or API
}

output "db_host" {
  description = "PostgreSQL database host"
  value       = "${var.project_name}-${var.environment}.supabase.co"
}

output "db_name" {
  description = "Database name"
  value       = "postgres"
}

output "db_port" {
  description = "Database port"
  value       = 5432
}

output "db_user" {
  description = "Database user"
  value       = "postgres"
}
