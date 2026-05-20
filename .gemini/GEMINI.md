# ECC for Gemini CLI

This file provides Gemini CLI with the baseline ECC workflow, review standards, and security checks for repositories that install the Gemini target.

## Overview

Everything Claude Code (ECC) is a cross-harness coding system with 36 specialized agents, and 142 skills.

Gemini support is currently focused on a strong project-local instruction layer via `.gemini/GEMINI.md`, plus the shared MCP catalog and package-manager setup assets shipped by the installer.

## Operational Scope

- **Default Scope:** You are mandated to work **exclusively on the frontend** codebase.
- **Backend Changes:** Do NOT modify any files in the `api/` directory unless the user explicitly instructs you to perform backend changes for a specific task.
- **Research:** You may read backend files for context or verification, but implementation must remain frontend-only by default.

## Core Workflow

1. Plan before editing large features.
2. Prefer test-first changes for bug fixes and new functionality.
3. Review for security before shipping.
4. Keep changes self-contained, readable, and easy to revert.

## Coding Standards

- Prefer immutable updates over in-place mutation.
- Keep functions small and files focused.
- Validate user input at boundaries.
- Never hardcode secrets.
- Fail loudly with clear error messages instead of silently swallowing problems.

## Security Checklist

Before any commit:

- No hardcoded API keys, passwords, or tokens
- All external input validated
- Parameterized queries for database writes
- Sanitized HTML output where applicable
- Authz/authn checked for sensitive paths
- Error messages scrubbed of sensitive internals

## Delivery Standards

- Use conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
- Run targeted verification for touched areas before shipping
- Prefer contained local implementations over adding new third-party runtime dependencies

## ECC Areas To Reuse

- `AGENTS.md` for repo-wide operating rules
- `contexts/` for team-maintained agent and rule assets
- `.agents/skills/` for runtime-loaded workflow guidance
