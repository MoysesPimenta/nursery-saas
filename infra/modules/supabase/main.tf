# Supabase Module - PostgreSQL Database, Auth, Storage, and RLS
# This module sets up the core backend infrastructure on Supabase

# Note: Supabase provider support is limited. Many resources may need manual configuration
# or use of the Supabase REST/Management API through scripts

terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# Placeholder for Supabase project creation
# In practice, projects are often created via Supabase dashboard
# This serves as a reference point for the project configuration

locals {
  project_id = var.project_name
  db_user    = "postgres"
  db_name    = "nursery_saas"
}

# Resource: Supabase Project
# Note: If using terraform-provider-supabase, this would create/manage the project
# Adjust based on actual provider capabilities and API support
resource "supabase_project" "main" {
  # Configuration depends on provider version and available resources
  # Placeholder for future implementation

  # Example attributes (adjust per provider documentation):
  # name            = "${var.project_name}-${var.environment}"
  # organization_id = var.organization_id
  # region          = var.region
  # database_password = var.db_password

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      Module      = "supabase"
    }
  )
}

# RLS Policies Configuration
# These policies enforce multi-tenant isolation at the database level
# Policies should be applied via Supabase CLI or SQL scripts during bootstrap

# Key RLS Policy Concepts:
# - Row-Level Security isolates data by tenant_id
# - All tables must have RLS enabled
# - Policies control SELECT, INSERT, UPDATE, DELETE operations
# - JWT claims are used to identify the current user

locals {
  rls_policies = {
    # tenants table - only users with matching org_id can see
    tenants_select = "auth.uid() IN (SELECT user_id FROM users WHERE tenant_id = tenants.id)"

    # users table - users can see users in their tenant
    users_select = "auth.uid() IN (SELECT id FROM users WHERE tenant_id = users.tenant_id)"

    # children table - multi-tenant isolation
    children_select = "auth.uid() IN (SELECT id FROM users WHERE tenant_id = children.tenant_id)"

    # employees table - isolated by tenant
    employees_select = "auth.uid() IN (SELECT id FROM users WHERE tenant_id = employees.tenant_id)"

    # audit_logs - read-only for audit purposes, created by system
    audit_logs_select = "auth.uid() IN (SELECT id FROM users WHERE tenant_id = audit_logs.tenant_id)"
  }
}

# Storage Configuration
# Supabase Storage buckets for file uploads (documents, photos, etc.)

locals {
  storage_buckets = {
    child_photos = {
      name          = "child-photos"
      public        = false
      file_size_limit = 10485760  # 10MB
    }
    documents = {
      name          = "documents"
      public        = false
      file_size_limit = 52428800  # 50MB
    }
    employee_files = {
      name          = "employee-files"
      public        = false
      file_size_limit = 20971520  # 20MB
    }
  }
}

# Output configuration for storage setup
# These buckets should be created via Supabase dashboard or CLI
