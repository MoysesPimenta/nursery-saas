# Cloudflare Module - DNS, CDN, WAF, and security

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# DNS Records
# Point domain to Vercel deployment
resource "cloudflare_record" "main" {
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "CNAME"
  value   = var.vercel_domain
  ttl     = 3600
  proxied = true
}

# www subdomain
resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  value   = var.vercel_domain
  ttl     = 3600
  proxied = true
}

# API subdomain (if using separate API domain)
resource "cloudflare_record" "api" {
  count   = var.enable_api_subdomain ? 1 : 0
  zone_id = var.zone_id
  name    = "api"
  type    = "CNAME"
  value   = var.vercel_domain
  ttl     = 3600
  proxied = true
}

# WAF Rules
# Protect against common web vulnerabilities
resource "cloudflare_waf_rule" "owasp_top_10" {
  count   = var.enable_waf ? 1 : 0
  zone_id = var.zone_id
  group_id = "62d9e41f8c7bffdc8d93241b"  # OWASP Top 10 rule group
  mode    = "challenge"  # Challenge instead of block for user experience
}

resource "cloudflare_waf_rule" "cve_rules" {
  count   = var.enable_waf ? 1 : 0
  zone_id = var.zone_id
  group_id = "62d9e41f8c7bffd94d93241e"  # CVE rules
  mode    = "block"
}

# Rate Limiting
# Prevent abuse and DDoS attacks
resource "cloudflare_rate_limit" "api_limit" {
  count       = var.enable_rate_limiting ? 1 : 0
  zone_id     = var.zone_id
  disabled    = false
  description = "Rate limit API endpoints"

  threshold = 100
  period    = 60

  match {
    request {
      url {
        path {
          matches = "/api/*"
        }
      }
    }
  }

  action {
    mode    = "challenge"
    timeout = 86400
  }
}

resource "cloudflare_rate_limit" "login_limit" {
  count       = var.enable_rate_limiting ? 1 : 0
  zone_id     = var.zone_id
  disabled    = false
  description = "Rate limit login attempts"

  threshold = 10
  period    = 300

  match {
    request {
      url {
        path {
          matches = "/auth/login"
        }
      }
    }
  }

  action {
    mode    = "challenge"
    timeout = 3600
  }
}

# Page Rules for caching and redirects
resource "cloudflare_page_rule" "redirect_www" {
  zone_id = var.zone_id
  target  = "www.${var.domain_name}"
  priority = 1

  actions {
    forwarding_url {
      url = "https://${var.domain_name}"
      status_code = 301
    }
  }
}

resource "cloudflare_page_rule" "cache_api" {
  count    = var.enable_cache ? 1 : 0
  zone_id  = var.zone_id
  target   = "${var.domain_name}/api/cache/*"
  priority = 2

  actions {
    cache_level = "cache_everything"
    browser_cache_ttl = 3600
  }
}

# SSL/TLS Configuration
resource "cloudflare_zone_settings_override" "main" {
  zone_id = var.zone_id

  settings {
    # Automatic HTTPS rewrites
    automatic_https_rewrites = "on"

    # Minimum TLS version
    min_tls_version = "1.2"

    # Universal SSL
    universal_ssl = "on"

    # Security level
    security_level = "high"

    # DDoS protection
    ddos_protection = "on"

    # Bot management
    bots_management = var.enable_bot_management ? "on" : "off"
  }
}

# Firewall Rules for additional security
resource "cloudflare_firewall_rule" "block_bad_bots" {
  count       = var.enable_firewall ? 1 : 0
  zone_id     = var.zone_id
  description = "Block known malicious bots"
  filter_id   = cloudflare_filter.bad_bots[0].id
  action      = "block"
  priority    = 1
}

resource "cloudflare_filter" "bad_bots" {
  count       = var.enable_firewall ? 1 : 0
  zone_id     = var.zone_id
  description = "Bad bots filter"
  expression  = "(cf.bot_management.score < 30)"
}

# Analytics Engine for custom logging
locals {
  analytics_enabled = var.environment != "dev"
}
