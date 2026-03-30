# Nursery-SaaS

A multi-tenant Health-Care Management SaaS platform designed specifically for nurseries and schools to streamline health-care operations, child wellness tracking, and parent communication.

## Overview

Nursery-SaaS is a comprehensive solution that enables nurseries and educational institutions to:

- Manage child health records and wellness profiles
- Track health observations and developmental milestones
- Facilitate secure communication between staff and parents
- Generate health reports and documentation
- Support multi-tenant architecture with complete data isolation

## Tech Stack

- **Frontend**: React, Next.js, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Infrastructure**: Terraform
- **Package Management**: npm workspaces
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Project Structure

```
.
├── apps/
│   ├── backend/          # Backend API server
│   └── frontend/         # Next.js web application
├── packages/
│   ├── shared/          # Shared types, utilities, and constants
│   └── ui/              # Shared React UI components
├── infra/               # Infrastructure as Code (Terraform)
├── docs/                # Project documentation
│   ├── blueprint/       # System design and architecture
│   ├── security/        # Security policies and guidelines
│   ├── data/            # Data models and schemas
│   ├── api/             # API documentation
│   └── integrations/    # Third-party integrations guide
└── .github/workflows/   # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Run tests
npm run test

# Format code
npm run format
```

## Development

This project uses npm workspaces to manage multiple packages. Each workspace has its own `package.json` and scripts.

### Commands

- `npm run dev` - Start development servers for all packages
- `npm run build` - Build all packages for production
- `npm run lint` - Run linting on all packages
- `npm run test` - Run tests for all packages
- `npm run test:db` - Run database tests for backend only
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without writing changes

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feature requests, please contact the development team.
