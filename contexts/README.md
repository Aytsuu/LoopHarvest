# AI Workspace

This directory is the team-facing home for project-specific AI workflow assets.

## Layout

- `agents/` — human-maintained agent definitions
- `rules/` — reusable policy and implementation guidance by stack/domain

## Runtime Note

Codex/ECC still auto-loads skills from the hidden `.agents/skills/` directory.
Keep that runtime surface aligned with the documented workflow in `AGENTS.md`.
