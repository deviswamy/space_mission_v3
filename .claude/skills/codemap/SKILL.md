---
name: codemap
description: "Generate and maintain CODEMAP.yaml — a navigable map of every file and directory with descriptions. Use when the user says /codemap, asks to generate or update the code map, wants a project overview, needs to document file purposes, or asks what a file/folder does. Two-step: (1) TypeScript script scans filesystem preserving existing descriptions, (2) Claude reads new files and fills TODO entries with meaningful one-liners."
disable-model-invocation: true
---

# Codemap — Project Structure Map

Generate and maintain `CODEMAP.yaml` at the project root: a nested YAML tree
mirroring the source directory structure where every file and directory has a
one-line description of its purpose.

## Workflow

### Step 1: Generate / Refresh Structure

Run the scanner script:

```bash
npx tsx .claude/skills/codemap/scripts/generate-codemap.ts
```

This will:
- Scan `client/`, `server/`, `shared/` directories
- Preserve existing descriptions from `CODEMAP.yaml`
- Mark new/undescribed entries as `"TODO"`
- Prune entries for deleted files
- Sort: `_` first, then directories, then files (alphabetically)

**CLI options:**
- `--include client server shared docs` — override which directories to scan
- `--exclude ".test.ts" ".spec.ts"` — add extra file exclusion suffix patterns
- `--output CODEMAP.yaml` — change output path
- `--max-depth 15` — limit recursion depth

### Step 2: Fill TODO Descriptions

After the script runs:

1. Read `CODEMAP.yaml`
2. Search for all entries with value `"TODO"`
3. For each batch of TODO entries (~10-15 at a time):
   - Read the actual source files
   - Write a meaningful one-line description (see style guide below)
   - Update the YAML entries
4. Save `CODEMAP.yaml` after each batch

**Important:** For files obvious from their name alone (e.g., `index.ts`, `types.ts`,
`constants.ts`), write descriptions without reading the file to save time.

### Step 3: Report

After all TODOs are resolved, report a summary:
- How many entries were updated
- Any files that couldn't be described (e.g., empty files)

## Description Style Guide

Descriptions should be **one line, under 80 characters**, focused on **purpose** not contents.

| Entry Type | Pattern | Example |
|---|---|---|
| Directory | What it contains/organizes | `"Authentication components"` |
| Component | `"Renders [what] with [feature]"` | `"Renders ISR detail page with competition metrics"` |
| Hook | `"Provides [data/behavior] for [context]"` | `"Provides typed API query hook with caching"` |
| Service | `"Manages [domain concept]"` | `"Manages turn lifecycle and phase transitions"` |
| Types/Schema | `"Defines [contract] for [purpose]"` | `"Defines ISR creation and update Zod schemas"` |
| Utility | `"Helper for [task]"` | `"Helper for formatting YAML from ISO data"` |
| Page | `"[Name] page — [content]"` | `"Dashboard page — ISR overview with activity feed"` |
| Config | `"Configures [what]"` | `"Configures Vite build for frontend"` |
| Entry point | `"Entry point for [module]"` | `"Entry point for Express server"` |
| Barrel/index | `"Re-exports [module] public API"` | `"Re-exports hook utilities"` |

## YAML Format Reference

```yaml
client/:
  _: "React 18 frontend application with Vite"
  src/:
    _: "Frontend source code"
    main.tsx: "Application entry point, mounts React root"
    App.tsx: "Root component with routing, providers, and SSE"
    components/:
      _: "UI components organized by domain"
      auth/:
        _: "Authentication components"
        LoginButton.tsx: "Handles Better-Auth login flow"
```

- `directory/` — trailing slash marks directories
- `_` — directory description (always first key)
- `filename.ts: "description"` — file with description
- `"TODO"` — needs a description from Claude

## Batch Processing Strategy

With ~450 source files on first run, process efficiently:

1. Start with directories — describe all `_: "TODO"` entries first (gives context)
2. Then files batch by batch (~15 files per batch)
3. For obvious files, write descriptions without reading
4. For complex files, read the first 50 lines to understand purpose
5. Mark each batch done before moving to the next
