# Vercel Module - Frontend hosting, serverless functions, and deployments

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Vercel Project
# Hosts the frontend application and serverless API functions
resource "vercel_project" "main" {
  name             = "${var.project_name}-${var.environment}"
  framework        = var.framework
  build_command    = var.build_command
  output_directory = var.output_directory

  environment = [
    {
      key   = "NEXT_PUBLIC_SUPABASE_URL"
      value = var.supabase_url
    },
    {
      key   = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value = var.supabase_anon_key
    },
    {
      key   = "SUPABASE_SERVICE_ROLE_KEY"
      value = var.supabase_service_role_key
    },
    {
      key   = "ENVIRONMENT"
      value = var.environment
    }
  ]

  git_repository = var.git_repository_url != "" ? {
    type = "github"
    repo = var.git_repository_url
  } : null

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      Module      = "vercel"
    }
  )
}

# Custom Domain Configuration
resource "vercel_project_domain" "main" {
  count         = var.enable_custom_domain ? 1 : 0
  project_id    = vercel_project.main.id
  domain        = var.domain_name
  redirect_from = var.redirect_domain != "" ? var.redirect_domain : null
}

# Preview Deployments Configuration
# Automatically deploy previews for pull requests
resource "vercel_project_settings" "preview" {
  project_id = vercel_project.main.id

  preview_deployment_suffix = var.preview_deployment_suffix
  preview_comments_enabled  = var.enable_preview_comments

  ignore_command = "if [ $VERCEL_ENV == 'preview' ] && [ $VERCEL_GIT_COMMIT_MESSAGE != *'deploy'* ]; then exit 0; fi"

  tags = merge(
    var.tags,
    {
      Type = "preview-settings"
    }
  )
}

# Environment Variables for Production
resource "vercel_env" "production" {
  count      = length(var.production_env_vars)
  project_id = vercel_project.main.id
  key        = var.production_env_vars[count.index].key
  value      = var.production_env_vars[count.index].value
  target     = ["production"]
}

# Environment Variables for Preview
resource "vercel_env" "preview" {
  count      = length(var.preview_env_vars)
  project_id = vercel_project.main.id
  key        = var.preview_env_vars[count.index].key
  value      = var.preview_env_vars[count.index].value
  target     = ["preview"]
}

# Analytics Configuration (if applicable)
# Enables Vercel Analytics for performance monitoring
locals {
  analytics_enabled = var.environment != "dev"
}
