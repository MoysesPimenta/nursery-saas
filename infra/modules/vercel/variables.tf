variable "project_name" {
  description = "Project name for Vercel"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "redirect_domain" {
  description = "Domain to redirect from (e.g., www variant)"
  type        = string
  default     = ""
}

variable "framework" {
  description = "Framework used by the project"
  type        = string
  default     = "nextjs"
}

variable "build_command" {
  description = "Build command"
  type        = string
  default     = "npm run build"
}

variable "output_directory" {
  description = "Output directory"
  type        = string
  default     = ".next"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "git_repository_url" {
  description = "GitHub repository URL (optional)"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Enable custom domain"
  type        = bool
  default     = true
}

variable "preview_deployment_suffix" {
  description = "Suffix for preview deployment URLs"
  type        = string
  default     = "-preview"
}

variable "enable_preview_comments" {
  description = "Enable preview comments on GitHub"
  type        = bool
  default     = true
}

variable "production_env_vars" {
  description = "Production environment variables"
  type = list(object({
    key   = string
    value = string
  }))
  default = []
}

variable "preview_env_vars" {
  description = "Preview environment variables"
  type = list(object({
    key   = string
    value = string
  }))
  default = []
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
