variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vercel_domain" {
  description = "Vercel deployment domain"
  type        = string
}

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "enable_rate_limiting" {
  description = "Enable rate limiting rules"
  type        = bool
  default     = true
}

variable "enable_cache" {
  description = "Enable caching rules"
  type        = bool
  default     = true
}

variable "enable_firewall" {
  description = "Enable Cloudflare Firewall rules"
  type        = bool
  default     = true
}

variable "enable_bot_management" {
  description = "Enable bot management (requires Business plan)"
  type        = bool
  default     = false
}

variable "enable_api_subdomain" {
  description = "Enable separate API subdomain"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
