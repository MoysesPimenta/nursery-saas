# Nursery-SaaS Infrastructure

This directory contains the Terraform Infrastructure-as-Code (IaC) for the Nursery-SaaS platform.

## Overview

The infrastructure leverages multiple cloud providers:
- **Supabase**: PostgreSQL database, authentication, real-time capabilities
- **Vercel**: Frontend hosting and serverless functions
- **Cloudflare**: DNS, CDN, and WAF
- **AWS**: Backup storage and state management

## Structure

```
infra/
├── README.md                    # This file
├── providers.tf                 # Provider configurations
├── variables.tf                 # Input variables
├── outputs.tf                   # Root module outputs
├── Makefile                     # Common Terraform commands
├── modules/
│   ├── supabase/               # Supabase project & resources
│   ├── vercel/                 # Vercel app deployment
│   ├── cloudflare/             # DNS & security
│   └── backup/                 # AWS backup infrastructure
└── environments/
    ├── dev.tfvars              # Development environment
    ├── staging.tfvars          # Staging environment
    └── prod.tfvars             # Production environment
```

## Getting Started

### Prerequisites
- Terraform >= 1.5.0
- AWS account with S3 bucket for state
- Supabase account and access token
- Vercel account and API token
- Cloudflare account and API token

### Bootstrap Infrastructure

```bash
# Initialize Terraform
make init

# Plan changes for dev environment
make plan ENV=dev

# Apply changes
make apply ENV=dev

# For production
make plan ENV=prod
make apply ENV=prod
```

## State Management

Terraform state is stored in S3 (`nursery-saas-tfstate` bucket) with the following structure:
- `terraform.tfstate` - Production state
- Development and staging states are managed separately per environment

## Variables

Each environment file (`dev.tfvars`, `staging.tfvars`, `prod.tfvars`) defines:
- Cloud provider credentials
- Domain names
- Instance sizes
- Backup retention policies
- Environment-specific settings

## Security Notes

- All credentials are injected via environment variables or `.tfvars` files (never commit secrets)
- State files contain sensitive data - ensure S3 bucket has proper access controls
- Use separate AWS accounts for production state isolation
- Enable encryption for S3 bucket and all RDS databases

## Modules

- **supabase**: Database, authentication, storage, RLS policies
- **vercel**: App hosting, preview deployments, custom domains
- **cloudflare**: DNS, WAF rules, rate limiting
- **backup**: S3 buckets, backup scheduling, retention policies

See individual module READMEs for detailed configuration options.
