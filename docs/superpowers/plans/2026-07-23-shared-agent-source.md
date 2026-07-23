# Shared Agent Source Implementation Plan

> **For agentic workers:** Implement in the current workspace and preserve unrelated existing changes.

**Goal:** Make `.agents/mdx-agent.md` the only manually maintained MDX Agent definition and generate the Claude and Codex client files from it.

**Architecture:** A dependency-free Node.js script reads the shared Markdown source, preserves Claude frontmatter, converts the shared metadata and body to escaped TOML for Codex, and supports write and consistency-check modes.

**Tech Stack:** Node.js ESM, Markdown, TOML

## Global Constraints

- Only `.agents`, `.claude`, and `.codex` are in scope.
- `.agents/mdx-agent.md` is the only manually maintained source.
- Do not add third-party dependencies.
- Do not alter the existing MDX Agent responsibilities or rules.
- Preserve unrelated worktree changes.
- Per the user's explicit instruction, do not add or run automated tests.

## Task 1: Add the shared source and synchronizer

- Copy the existing `.claude/agents/mdx-agent.md` to `.agents/mdx-agent.md`.
- Add `scripts/sync-agents.mjs`.
- Parse the required `name` and `description` frontmatter fields.
- Render `.claude/agents/mdx-agent.md` with frontmatter at the beginning.
- Render `.codex/agents/mdx-agent.toml` with escaped TOML strings.
- Support `--check` without writing files.

## Task 2: Expose commands and generate client files

- Add `agents:sync` and `agents:check` to `package.json`.
- Run `pnpm agents:sync`.
- Run `pnpm agents:check`.
- Confirm all three Agent files are UTF-8 without BOM.

## Task 3: Document the workflow

- Point README directory documentation and rule links to `.agents`.
- Document `pnpm agents:sync` and `pnpm agents:check`.
- Review only task-owned diffs and leave unrelated worktree changes untouched.
