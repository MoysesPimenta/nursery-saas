.PHONY: init plan apply destroy bootstrap fmt validate clean help

ENV ?= dev
AWS_REGION ?= us-east-1

# Default target
.DEFAULT_GOAL := help

# ANSI color codes
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)Nursery-SaaS Infrastructure Management$(NC)"
	@echo ""
	@echo "Usage: make [target] ENV=<env>"
	@echo ""
	@echo "Available targets:"
	@echo "  $(GREEN)init$(NC)        - Initialize Terraform for the specified environment"
	@echo "  $(GREEN)validate$(NC)    - Validate Terraform configuration"
	@echo "  $(GREEN)fmt$(NC)         - Format Terraform files"
	@echo "  $(GREEN)plan$(NC)        - Plan infrastructure changes (dry-run)"
	@echo "  $(GREEN)apply$(NC)       - Apply infrastructure changes"
	@echo "  $(GREEN)destroy$(NC)     - Destroy infrastructure (use with caution!)"
	@echo "  $(GREEN)bootstrap$(NC)   - Full init + plan + apply sequence"
	@echo "  $(GREEN)clean$(NC)       - Remove local Terraform state and cache"
	@echo "  $(GREEN)cost$(NC)        - Estimate infrastructure costs"
	@echo ""
	@echo "Environment: $(YELLOW)$(ENV)$(NC)"
	@echo "AWS Region: $(YELLOW)$(AWS_REGION)$(NC)"
	@echo ""
	@echo "Examples:"
	@echo "  make init ENV=dev"
	@echo "  make plan ENV=staging"
	@echo "  make apply ENV=prod"

init:
	@echo "$(BLUE)[$(ENV)] Initializing Terraform...$(NC)"
	terraform init

validate:
	@echo "$(BLUE)Validating Terraform configuration...$(NC)"
	terraform validate
	@echo "$(GREEN)Validation successful!$(NC)"

fmt:
	@echo "$(BLUE)Formatting Terraform files...$(NC)"
	terraform fmt -recursive
	@echo "$(GREEN)Formatting complete!$(NC)"

plan: init
	@echo "$(BLUE)[$(ENV)] Planning infrastructure changes...$(NC)"
	terraform plan -var-file=environments/$(ENV).tfvars -out=tfplan

apply: init
	@echo "$(YELLOW)Applying infrastructure changes for $(ENV)...$(NC)"
	@read -p "Are you sure you want to apply changes to $(ENV)? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		terraform apply -var-file=environments/$(ENV).tfvars -auto-approve; \
		echo "$(GREEN)Apply complete!$(NC)"; \
	else \
		echo "$(RED)Apply cancelled.$(NC)"; \
	fi

destroy:
	@echo "$(RED)!!! WARNING: Destroying infrastructure for $(ENV) !!!$(NC)"
	@read -p "Type 'destroy-$(ENV)' to confirm: " confirm; \
	if [ "$$confirm" = "destroy-$(ENV)" ]; then \
		terraform destroy -var-file=environments/$(ENV).tfvars -auto-approve; \
		echo "$(GREEN)Infrastructure destroyed.$(NC)"; \
	else \
		echo "$(RED)Destroy cancelled.$(NC)"; \
	fi

bootstrap: init plan
	@echo "$(BLUE)[$(ENV)] Bootstrapping infrastructure...$(NC)"
	@read -p "Bootstrap $(ENV) infrastructure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		terraform apply -var-file=environments/$(ENV).tfvars -auto-approve; \
		echo "$(GREEN)Infrastructure bootstrapped for $(ENV)!$(NC)"; \
	else \
		echo "$(RED)Bootstrap cancelled.$(NC)"; \
	fi

clean:
	@echo "$(BLUE)Cleaning Terraform files...$(NC)"
	rm -rf .terraform
	rm -rf tfplan
	rm -f .terraform.lock.hcl
	@echo "$(GREEN)Clean complete!$(NC)"

cost:
	@echo "$(BLUE)[$(ENV)] Estimating infrastructure costs...$(NC)"
	@echo "Note: Install infracost for cost estimation"
	@echo "https://www.infracost.io/"

state-show:
	@echo "$(BLUE)[$(ENV)] Showing Terraform state...$(NC)"
	terraform show

state-list:
	@echo "$(BLUE)[$(ENV)] Listing resources in state...$(NC)"
	terraform state list

output:
	@echo "$(BLUE)[$(ENV)] Terraform outputs...$(NC)"
	terraform output

refresh: init
	@echo "$(BLUE)[$(ENV)] Refreshing Terraform state...$(NC)"
	terraform refresh -var-file=environments/$(ENV).tfvars

# Lock terraform version and provider versions
lock-dependencies:
	@echo "$(BLUE)Locking Terraform dependencies...$(NC)"
	terraform providers lock -platform=darwin_amd64 -platform=darwin_arm64 -platform=linux_amd64 -platform=windows_amd64

# Lint Terraform files
lint:
	@command -v tflint >/dev/null 2>&1 || { echo "tflint not installed. Install: https://github.com/terraform-linters/tflint"; exit 1; }
	@echo "$(BLUE)Running tflint...$(NC)"
	tflint --init
	tflint

.PHONY: state-show state-list output refresh lock-dependencies lint
