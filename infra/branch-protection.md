# Branch Protection Rules

This document outlines the required branch protection rules for the `main` branch. These rules must be configured in the GitHub repository settings.

## Required Status Checks

Before any pull request can be merged into `main`, the following status checks must pass:

- `Typecheck`
- `Lint`
- `Build`

These checks are defined in the primary CI workflow (`.github/workflows/ci.yml`) and ensure that no code with type errors, linting warnings, or build failures makes it into the `main` branch.

In addition, the `Dependency Review` check (`.github/workflows/dependency-review.yml`) will flag and block merges if new high or critical severity CVEs are introduced by dependency changes.

## Review Requirements

- **Require approvals**: Require at least one approving review on every pull request before it can be merged.

## Repository Restrictions

- **Prohibit force-push**: Do not allow force-pushes to the `main` branch.
- **Prohibit branch deletion**: Do not allow the `main` branch to be deleted.
