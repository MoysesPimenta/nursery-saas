output "zone_id" {
  description = "Cloudflare zone ID"
  value       = var.zone_id
}

output "nameservers" {
  description = "Cloudflare nameservers"
  value = [
    "ns1.cloudflare.com",
    "ns2.cloudflare.com"
  ]
  description = "Nameservers to configure at domain registrar"
}

output "domain_status" {
  description = "Domain configuration status"
  value       = "Configured with Cloudflare"
}

output "waf_enabled" {
  description = "WAF protection enabled"
  value       = var.enable_waf
}

output "rate_limiting_enabled" {
  description = "Rate limiting enabled"
  value       = var.enable_rate_limiting
}

output "cache_enabled" {
  description = "Caching enabled"
  value       = var.enable_cache
}
