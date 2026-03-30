# Contributing to Nursery-SaaS

Thank you for your interest in the Nursery-SaaS project!

## Code Review and Collaboration

This is a collaborative project with a distributed team. While we welcome feedback, questions, and code reviews from all team members, please note the following guidelines:

### Review Process

- **Code Reviews**: All changes go through a formal code review process. Team members are encouraged to review pull requests and provide constructive feedback.
- **Design Discussions**: Design decisions and architectural changes should be discussed before implementation.
- **Documentation**: Changes should include appropriate updates to related documentation.

### Important Note on Direct Contributions

**Direct code commits to this repository should only be made by authorized team members.** If you wish to contribute code changes:

1. Create a feature branch from the appropriate base branch
2. Implement your changes following the project guidelines (see below)
3. Submit a pull request (PR) for code review
4. Address any feedback from reviewers
5. Once approved, the PR will be merged by an authorized maintainer

Do not commit directly to main, develop, or any protected branches.

## Development Guidelines

### Code Style

- Use TypeScript with strict mode enabled
- Follow ESLint and Prettier configurations
- Write meaningful variable and function names
- Add comments for complex logic

### Before Submitting a PR

1. Ensure all tests pass: `npm run test`
2. Run linting: `npm run lint`
3. Format code: `npm run format`
4. Update relevant documentation
5. Add unit tests for new functionality
6. Update the CHANGELOG if applicable

### Commit Messages

Write clear, concise commit messages that describe the changes:

- Use imperative mood ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Provide additional context in the body if needed

### Pull Request Guidelines

- Reference any related issues or PRs
- Provide a clear description of the changes
- Include screenshots or examples if applicable
- Ensure CI/CD checks pass

## Project Structure and Conventions

- `/apps` - Application packages (frontend, backend)
- `/packages` - Shared libraries and utilities
- `/infra` - Infrastructure as Code
- `/docs` - Project documentation
- Use TypeScript for all code
- Shared types should be in `@nursery-saas/shared`
- UI components should be in `@nursery-saas/ui`

## Questions and Discussions

- Use GitHub Discussions for general questions
- Use GitHub Issues for bug reports and feature requests
- Reach out to the team leads for architecture or design questions

## Code of Conduct

Please be respectful and professional in all interactions. We're committed to creating an inclusive and welcoming environment for all contributors.

---

For more information about the project, see [README.md](README.md).
