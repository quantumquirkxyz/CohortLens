# Repository Agent Skills

This directory is the repository-local, tool-agnostic Agent Skills bundle. It
is compatible with Codex-style Agent Skills and Claude Code.

- `.agents/skills/` is canonical and version-controlled.
- Each skill is a self-contained directory with `SKILL.md` and any companion resources.
- `skills-lock.json` records upstream provenance, revisions, and hashes.
- `.claude/skills/` contains Claude-specific adaptations of skills, with symlinks to shared skills.

## Skill structure

- `.claude/skills/make-project/` — Claude-specific version adapted for CohortLens (DeFi capital flow graph platform). Uses `quantumquirkxyz` org, CohortLens domain vocabulary, and appropriate field suggestions.
- All other skills are symlinked from `.agents/skills/` to avoid duplication.

## CohortLens context

This repo is a DeFi platform powered by Graph Engineering. When using skills:
- Use domain vocabulary from `CONTEXT.md` (Capital Flow Graph, Wallet, Protocol, etc.)
- Reference the correct GitHub org: `quantumquirkxyz`
- Reference the correct repo: `CohortLens`
- Avoid synonyms the glossary rejects (e.g. "transaction" → "Capital flow", "user" → "Wallet")

Use the root `AGENTS.md` for CohortLens-specific repository guidance and routing.
