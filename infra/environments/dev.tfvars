# Development Environment Configuration

environment             = "dev"
project_name           = "nursery-saas"
domain_name            = "dev.mynurse.local"
aws_region             = "us-east-1"

# Supabase Configuration
supabase_organization_id = "YOUR_ORG_ID"

# Vercel Configuration
vercel_team_id = ""

# Cloudflare Configuration
cloudflare_zone_id = "YOUR_ZONE_ID"

# Backup Configuration
backup_retention_days = 7
enable_waf           = false  # Disable expensive features in dev
enable_rate_limiting = true

# Tags
tags = {
  Environment = "development"
  ManagedBy   = "terraform"
  Project     = "nursery-saas"
}
