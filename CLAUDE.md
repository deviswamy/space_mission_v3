# Mission Control — Claude Guidelines

## Overview

**Mission Control** is a multi-tenant B2B SaaS platform for space organisations to manage crew assignments, build skill profiles, and auto-match crew to missions intelligently. It eliminates manual cross-referencing of skills, availability, and commitments across multi-org environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## Package Manager — Bun

**Always use Bun.** It is the package manager, runtime, and test runner for this project.

- `bun install` — not npm/yarn/pnpm
- `bun run <script>` — not npm/yarn run
- `bunx <pkg>` — not npx
- `bun test` — not jest/vitest directly
- `bun <file>` — not node/ts-node
- Bun loads `.env` automatically — do not use dotenv

## Frontend Conventions

### API Calls — Custom Hooks

Never call `apiFetch` directly inside a component. Always wrap it in a custom hook in `client/src/hooks/`.

- Hook owns the `apiFetch` call, `error` state, and `isPending` state
- Re-throw errors from the hook so the caller can react (e.g. skip navigation)
- Use `finally` to always reset `isPending`
- Component calls the hook, navigates on success, and reads `error` for display

```ts
// ✅ correct
const { changePassword, error, isPending } = useChangePassword();

// ❌ wrong — apiFetch called directly in component
await apiFetch("/auth/change-password", { ... });
```

## MVP feature set

-  Multi-tenant (organization), authenticate users and authorize then based on their roles
-  Mission lifecycle with approval workflow
- Crew management system with skill profiles
- Auto-matching engine
- Dashboard with meaningful org-level metrics

### Multi-Tenancy

- Cross-org ID guessing returns **404** (not 403) — no information leakage
- Test with two isolated orgs to verify

### Role Access Control

| Role | Can do |
| --- | --- |
| `director` | Everything: approve missions, manage org/skills/crew, run matcher |
| `mission_lead` | Create/submit missions, submitting mission should run the auto matcher for crew assisgnment, confirm assignments |
| `crew_member` | Manage own profile/availability, accept/reject own assignments |

### Authn/z

TBA

### Mission Lifecycle

```text
draft → submitted → approved → active → completed
                 ↘ rejected → draft
```

Mission Lead cannot approve, they can only submit missions.

### Crew management

### Auto-Matching Engine

TBA

### Dashboard

TBA