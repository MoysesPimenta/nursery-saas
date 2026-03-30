output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.main.id
}

output "project_url" {
  description = "Vercel project deployment URL"
  value       = "https://${var.project_name}-${var.environment}.vercel.app"
}

output "preview_url_template" {
  description = "Template for preview deployment URLs"
  value       = "https://${var.project_name}-[branch].${var.environment}${var.preview_deployment_suffix}.vercel.app"
}

output "custom_domain_url" {
  description = "Custom domain URL"
  value       = var.enable_custom_domain ? "https://${var.domain_name}" : null
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.main.name
}
