# Staging Environment Configuration

environment             = "staging"
project_name           = "nursery-saas"
domain_name            = "staging.mynurse.app"
aws_region             = "us-east-1"

# Supabase Configuration
supabase_organization_id = "YOUR_ORG_ID"

# Vercel Configuration
vercel_team_id = ""

# Cloudflare Configuration
cloudflare_zone_id = "YOUR_ZONE_ID"

# Backup Configuration
backup_retention_days = 14
enable_waf           = true
enable_rate_limiting = true

# Tags
tags = {
  Environment = "staging"
  ManagedBy   = "terraform"
  Project     = "nursery-saas"
}
