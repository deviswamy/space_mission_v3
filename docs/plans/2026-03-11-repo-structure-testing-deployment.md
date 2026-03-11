# Mission Control — Repository Structure, Testing, Quality & Deployment Plan

## Context

The project is in blueprint phase — docs exist, no source code yet. This plan defines the monorepo layout, local dev workflow, testing strategy (QA-grade), quality gate with git hook, and deployment to Vercel (frontend) + GCP (backend).

---

## 1. Repository Structure

Bun-native monorepo with three workspaces. No Turborepo needed.

```
space_mission_v3/
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint + typecheck + test on every push/PR
│       └── deploy.yml          # deploy to Vercel + GCP on push to main
├── client/                     # Vite + React frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── lib/
│       │   ├── auth.ts         # better-auth client
│       │   ├── query-client.ts # TanStack Query config
│       │   └── api.ts          # typed fetch wrapper
│       ├── components/
│       │   ├── ui/             # Shadcn/UI generated components
│       │   ├── AuthGuard.tsx
│       │   ├── RoleGuard.tsx
│       │   └── layout/
│       │       ├── AppShell.tsx
│       │       ├── Sidebar.tsx
│       │       └── TopBar.tsx
│       ├── stores/
│       │   └── ui.store.ts
│       ├── hooks/
│       │   ├── useMissions.ts
│       │   ├── useCrew.ts
│       │   └── useAssignments.ts
│       └── pages/
│           ├── Login.tsx
│           ├── ChangePassword.tsx
│           ├── Dashboard.tsx
│           ├── missions/
│           │   ├── MissionList.tsx
│           │   ├── MissionNew.tsx
│           │   ├── MissionDetail.tsx
│           │   ├── MissionEdit.tsx
│           │   └── MissionAssignments.tsx
│           ├── crew/
│           │   ├── CrewRoster.tsx
│           │   └── InviteModal.tsx
│           └── profile/
│               ├── Profile.tsx
│               └── MyAssignments.tsx
├── server/                     # Express + Drizzle backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts                # entry: binds Express + starts server
│   ├── app.ts                  # Express app factory (no listen — testable)
│   ├── lib/
│   │   ├── auth.ts             # better-auth instance
│   │   ├── db.ts               # Drizzle client
│   │   └── errors.ts           # AppError class + global handler
│   ├── middleware/
│   │   ├── requireAuth.ts
│   │   └── requireRole.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── missions.ts
│   │   ├── assignments.ts
│   │   ├── crew.ts
│   │   ├── profile.ts
│   │   ├── skills.ts
│   │   └── admin/
│   │       └── invite.ts
│   ├── services/
│   │   ├── matcher.ts          # matchCrew() — pure function, no DB calls
│   │   └── mission.service.ts  # submit transaction: status + matcher + assignments
│   └── db/
│       ├── migrate.ts
│       ├── seed.ts             # seeds 2 orgs, directors, skills
│       └── migrations/         # committed drizzle-kit output
├── shared/                     # shared between client and server
│   ├── package.json
│   ├── schema/
│   │   ├── index.ts
│   │   ├── auth.ts             # better-auth tables
│   │   ├── orgs.ts
│   │   ├── missions.ts
│   │   └── crew.ts
│   ├── dtos.ts                 # API response shapes
│   ├── contracts.ts            # Zod request/response schemas
│   └── branded-types.ts        # OrgId, UserId, MissionId, SkillId
├── tests/                      # all tests at repo root
│   ├── setup.ts                # test DB: connect, migrate, seed, teardown
│   ├── helpers/
│   │   ├── seed-test-db.ts
│   │   └── make-request.ts     # typed supertest wrapper
│   ├── unit/
│   │   ├── matcher.test.ts
│   │   └── contracts.test.ts
│   ├── integration/
│   │   ├── tenancy.test.ts     # cross-org 404 enforcement
│   │   ├── auth.test.ts
│   │   ├── missions.test.ts
│   │   ├── crew.test.ts
│   │   └── assignments.test.ts
│   └── e2e/
│       ├── playwright.config.ts
│       ├── auth.spec.ts
│       ├── mission-lifecycle.spec.ts
│       └── crew-assignment.spec.ts
├── .env.example
├── .gitignore
├── biome.json
├── docker-compose.yml          # local Postgres only (dev + test DBs)
├── drizzle.config.ts
└── package.json                # root workspace config + all scripts
```

---

## 2. Root `package.json` Scripts

```json
{
  "name": "mission-control",
  "private": true,
  "workspaces": ["client", "server", "shared"],
  "scripts": {
    "dev": "bun run --parallel dev:server dev:client",
    "dev:server": "bun --hot server/index.ts",
    "dev:client": "bunx vite --config client/vite.config.ts",

    "build:client": "bunx vite build --config client/vite.config.ts",
    "build:server": "bun build server/index.ts --target=bun --outdir=dist/server",

    "typecheck": "bun run --parallel typecheck:shared typecheck:server typecheck:client",
    "typecheck:shared": "bun run --cwd shared tsc --noEmit",
    "typecheck:server": "bun run --cwd server tsc --noEmit",
    "typecheck:client": "bun run --cwd client tsc --noEmit",

    "lint": "bunx biome check .",
    "lint:fix": "bunx biome check --apply .",

    "test": "bun test tests/",
    "test:unit": "bun test tests/unit/",
    "test:integration": "bun test tests/integration/",
    "test:e2e": "bunx playwright test",
    "test:watch": "bun test --watch tests/unit/",

    "check": "bun run lint && bun run typecheck && bun run test:unit && bun run test:integration",

    "db:generate": "bunx drizzle-kit generate",
    "db:migrate": "bun server/db/migrate.ts",
    "db:seed": "bun server/db/seed.ts",
    "db:studio": "bunx drizzle-kit studio",

    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

---

## 3. Local Development Setup

### Prerequisites
- Bun installed
- Docker Desktop running (for Postgres only)
- `.env` copied from `.env.example` and filled in

### Start sequence
```bash
bun run docker:up      # spins up postgres (5432) and postgres_test (5433)
bun run db:migrate     # runs migrations against dev DB
bun run db:seed        # seeds Orion + Apollo orgs, directors, skills
bun run dev            # starts server (bun --hot :3000) + client (vite :5173) in parallel
```

Vite proxies `/api` → `localhost:3000` so no CORS config needed in dev.

### `.env.example`
```bash
# Database
DATABASE_URL=postgresql://mission_user:mission_pass@localhost:5432/mission_control
DATABASE_URL_TEST=postgresql://mission_user:mission_pass@localhost:5433/mission_control_test

# Server
PORT=3000
NODE_ENV=development

# better-auth (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=http://localhost:3000

# Client (Vite — must be VITE_ prefix)
VITE_API_URL=http://localhost:3000
```

### `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mission_control
      POSTGRES_USER: mission_user
      POSTGRES_PASSWORD: mission_pass
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mission_user"]
      interval: 5s
      retries: 5

  postgres_test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mission_control_test
      POSTGRES_USER: mission_user
      POSTGRES_PASSWORD: mission_pass
    ports: ["5433:5432"]   # no volume — resets on docker compose down

volumes:
  postgres_data:
```

---

## 4. Testing Strategy (Senior QA Perspective)

### Philosophy
- Tests are organised by confidence layer: unit → integration → e2e
- Each layer catches a different class of defect
- Tests run in CI in order: fast/cheap first, slow/expensive last
- Integration tests own a **test DB** — schema wiped + migrated + seeded in `beforeAll`
- Individual mutating tests roll back via transaction or `afterEach` cleanup

---

### Layer 1 — Unit Tests (`tests/unit/`)

**Who**: Developer and QA
**When**: Every commit (fast, no DB, <2s)
**Runner**: `bun test tests/unit/`

#### `matcher.test.ts` — Auto-matching engine (pure function)
Tests the `matchCrew(mission, candidates)` function in isolation. No database.

| Test case | Why it matters |
|---|---|
| Lead ranks above Senior above Junior for same skill | Core scoring logic |
| Crew with no availability window is excluded | Prevents wrong assignments |
| Partial fill when fewer candidates than slots | Graceful degradation |
| Crew with full workload receives penalty score | Fairness algorithm |
| Deterministic output for identical scores (stable sort by userId) | No flapping assignments |
| Missing required skill scores zero (not excluded) | Algorithm correctness |
| Returns empty array when no candidates | Edge case |

#### `contracts.test.ts` — Zod schema validation
Tests that request schemas accept valid input and reject invalid input.

| Test case | Why it matters |
|---|---|
| `CreateMissionSchema` rejects missing `title` | Required field enforcement |
| `CreateMissionSchema` rejects `startDate` after `endDate` | Business rule in schema |
| `InviteUserSchema` rejects `role: "director"` | Directors cannot be invited |
| `UpdateProfileSchema` rejects invalid experience level | Enum enforcement |
| All schemas strip unknown fields | Prevents data injection |

---

### Layer 2 — Integration Tests (`tests/integration/`)

**Who**: QA + backend dev
**When**: Every PR + CI (requires test DB, ~15–30s)
**Runner**: `NODE_ENV=test bun test tests/integration/`
**Setup**: `tests/setup.ts` connects to `DATABASE_URL_TEST`, drops and recreates schema, runs migrations, seeds baseline data before each suite.

#### `tenancy.test.ts` — **Most critical suite**
Verifies the multi-tenant isolation guarantee. Every cross-org access must return **404** (not 403 — no information leakage).

| Test case | Why it matters |
|---|---|
| Org A director reads Org B mission → 404 | Core tenancy guarantee |
| Org A director reads Org B crew member → 404 | User enumeration prevention |
| Org A mission_lead submits Org B mission → 404 | Cross-org write blocked |
| Org A crew_member accepts Org B assignment → 404 | Assignment isolation |
| orgId is never accepted from query params — always from session | Prevents ID injection |
| Unauthenticated request to any resource → 401 | Auth before tenancy check |

#### `auth.test.ts`
| Test case | Why it matters |
|---|---|
| Login correct credentials → 200 + session cookie set | Happy path |
| Login wrong password → 401 with generic message | No password oracle |
| Login unknown email → 401 with same generic message | No user enumeration |
| Access `/api/missions` without session → 401 | Auth guard working |
| `mustChangePassword=true` → 403 on all routes except `/auth/change-password` | Forced change enforcement |
| Change password → `mustChangePassword=false` → subsequent requests succeed | Password flow completes |
| Invite user as director → temp password works on first login | Invite flow end-to-end |
| Invite user as mission_lead → 403 | Role guard on invite |

#### `missions.test.ts`
| Test case | Why it matters |
|---|---|
| `mission_lead` creates mission → 201, status = `draft` | Happy path |
| `crew_member` creates mission → 403 | Role guard |
| Edit `submitted` mission → 400 | Lifecycle enforcement |
| Submit mission → status = `submitted`, assignments created | Matcher triggered on submit |
| Submit mission with no skill requirements → 400 | Business rule |
| `mission_lead` approves mission → 403 | Role enforcement |
| Director approves → `approved` | Happy path |
| Director rejects → `rejected`, mission_lead can re-draft | Rejection flow |
| Active mission cannot be rejected → 400 | State machine correctness |

#### `assignments.test.ts`
| Test case | Why it matters |
|---|---|
| Crew member accepts own assignment → `accepted` | Happy path |
| Crew member rejects own assignment → `rejected` | Happy path |
| Crew member accepts another crew member's assignment → 404 | Isolation |
| Director views all assignments for a mission | Role visibility |
| `crew_member` hits `/missions/:id/assignments` → 403 | Route-level guard |

#### `crew.test.ts`
| Test case | Why it matters |
|---|---|
| Crew member updates own profile → 200 | Happy path |
| Crew member updates another user's profile → 404 | Isolation |
| Director views full crew roster for own org | Role visibility |
| Availability dates with overlap are rejected → 400 | Business rule |

---

### Layer 3 — E2E Tests (`tests/e2e/`)

**Who**: QA
**When**: Pre-deploy (CI on push to `main`, or nightly)
**Runner**: `bunx playwright test`
**Target**: Runs against the locally running full stack (`bun run dev` or a staging URL)

E2E tests cover the critical user journeys end-to-end through the real browser UI.

#### `auth.spec.ts`
- Director logs in, is taken to Dashboard
- Invited user logs in with temp password, is forced to change password, then accesses Dashboard

#### `mission-lifecycle.spec.ts`
- Mission lead creates a draft mission with skill requirements
- Mission lead submits the mission
- Director reviews assignments page showing matched crew
- Director approves the mission
- Mission status shows "Active" on the list

#### `crew-assignment.spec.ts`
- Crew member logs in, sees pending assignment on dashboard
- Crew member accepts assignment — status updates to "Accepted"
- Crew member profile shows correct availability window

---

## 5. Quality Gate

### Order (fail-fast — each step must pass before the next runs)

```
1. bunx biome check .           → formatting + lint (fastest)
2. bun run typecheck            → tsc --noEmit all workspaces in parallel
3. bun test tests/unit/         → pure logic tests, no DB (~2s)
4. bun test tests/integration/  → requires test DB running (~15–30s)
```

Run all: `bun run check`

### `biome.json`
```json
{
  "$schema": "https://biomejs.dev/schemas/1.x/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error" },
      "style": { "useConst": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "ignore": ["dist/", "node_modules/", "server/db/migrations/", "client/src/components/ui/"]
  }
}
```

---

## 6. Quality Gate: Claude Stop Hook + Git Hooks

### Claude Code Stop Hook (already exists — `.claude/hooks/quality-gate-stop.ts`)

Registered in `.claude/settings.json` under `Stop`. Runs automatically every time Claude finishes a task. It:

1. Skips if no file changes (fast exit)
2. Runs `biome check --apply` — auto-fixes formatting + lint
3. Runs `bun build` (tsc check) — if type errors remain, spawns a Haiku agent to auto-fix them
4. Adds JSDoc to all changed `.ts`/`.tsx` files via a Haiku agent
5. Stages all changes, commits with `"chore: auto quality gate + docs"`, pushes to origin, and creates a PR via `gh pr create`

This means **every task Claude completes is automatically linted, type-checked, documented, and raised as a PR.** No manual steps required.

The `biome:check` script and `bun build` script must exist in `package.json` for this hook to work:
```json
"biome:check": "bunx biome check --apply .",
"build": "bun run typecheck"
```

### Git Hooks (for developer-driven commits and pushes)

Two hooks are installed: pre-commit (fast) and pre-push (full gate).

### Setup: `scripts/setup-hooks.ts`
```typescript
// bun scripts/setup-hooks.ts — run once after cloning
import { writeFileSync, chmodSync } from "fs";

// Pre-commit: fast checks only (lint + typecheck + unit tests)
// Keeps interactive commits snappy
const preCommit = `#!/bin/sh
echo "Pre-commit: lint + typecheck + unit tests..."
bunx biome check . || exit 1
bun run typecheck || exit 1
bun test tests/unit/ || exit 1
echo "Pre-commit passed."
`;

// Pre-push: full quality gate including integration tests
// Blocks pushing broken code to the remote — runs before any PR is created
const prePush = `#!/bin/sh
echo "Pre-push: full quality gate (this may take ~30s)..."
bunx biome check . || exit 1
bun run typecheck || exit 1
bun test tests/unit/ || exit 1
bun test tests/integration/ || exit 1
echo "Pre-push passed. Safe to push."
`;

writeFileSync(".git/hooks/pre-commit", preCommit);
chmodSync(".git/hooks/pre-commit", 0o755);

writeFileSync(".git/hooks/pre-push", prePush);
chmodSync(".git/hooks/pre-push", 0o755);

console.log("Git hooks installed: pre-commit + pre-push");
```

Add to root `package.json` scripts:
```json
"prepare": "bun scripts/setup-hooks.ts"
```

`bun install` triggers `prepare` automatically — both hooks are installed for every developer on clone.

**Hook summary:**

| Hook | Runs | Checks | Speed |
|---|---|---|---|
| pre-commit | On every `git commit` | lint + typecheck + unit | ~5s |
| pre-push | On every `git push` (before PR) | lint + typecheck + unit + integration | ~30s |

Integration tests require the test DB to be running locally (`bun run docker:up`). If the DB is not up, pre-push will fail with a connection error — this is intentional. Developers must have the local stack running before pushing.

---

## 7. Deployment: Vercel (Frontend) + GCP (Backend)

### Architecture

```
Browser → Vercel CDN (React SPA)
              ↓ /api/* requests
        GCP API Gateway
              ↓
        Cloud Run (Express — not Lambda; see rationale)
              ↓
        Cloud SQL (Postgres 16 — managed)
```

**Why Cloud Run instead of Cloud Functions/Lambda:**
Express + Drizzle ORM + better-auth (session-based) does not fit the stateless function model cleanly. Sessions require consistent connection pooling. Cloud Run runs the containerised Express app with persistent connections and scales to zero — same cost benefit as Lambda without the cold-start overhead of initialising the ORM pool on every request.

### GCP Services Used

| Service | Purpose |
|---|---|
| Cloud Run | Containerised Express server, scales to zero |
| API Gateway | Rate limiting, auth header forwarding, CORS policy |
| Cloud SQL (Postgres 16) | Managed Postgres, private VPC connection to Cloud Run |
| Artifact Registry | Stores Docker images |
| Secret Manager | `DATABASE_URL`, `BETTER_AUTH_SECRET` |
| Cloud Build | CI/CD trigger on push to `main` |

### `Dockerfile` (server)
```dockerfile
FROM oven/bun:1.1-alpine AS base
WORKDIR /app
COPY package.json bun.lockb ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN bun install --frozen-lockfile --production

COPY shared/ ./shared/
COPY server/ ./server/
COPY drizzle.config.ts ./
RUN bun build server/index.ts --target=bun --outdir=dist/server --minify

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
COPY --from=base /app/dist/server /app/dist/server
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/server/db/migrations /app/server/db/migrations

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "bun server/db/migrate.ts && bun /app/dist/server/index.js"]
```

### Environment Variables

| Variable | Where | How set |
|---|---|---|
| `DATABASE_URL` | GCP Secret Manager | `gcloud secrets create` |
| `BETTER_AUTH_SECRET` | GCP Secret Manager | `gcloud secrets create` |
| `BETTER_AUTH_URL` | Cloud Run env | Set to API Gateway URL |
| `NODE_ENV` | Cloud Run env | `production` |
| `VITE_API_URL` | Vercel env var | Set to API Gateway URL |

### `vercel.json` (SPA routing)
```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

---

## 8. CI/CD Workflows

### `.github/workflows/ci.yml` — runs on every push + PR
```yaml
on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    services:
      postgres_test:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: mission_control_test
          POSTGRES_USER: mission_user
          POSTGRES_PASSWORD: mission_pass
        ports: ["5433:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: '1.1' }
      - run: bun install --frozen-lockfile
      - run: bunx biome check .
      - run: bun run typecheck
      - run: bun test tests/unit/
      - run: bun test tests/integration/
        env:
          NODE_ENV: test
          DATABASE_URL_TEST: postgresql://mission_user:mission_pass@localhost:5433/mission_control_test
          BETTER_AUTH_SECRET: ci-throwaway-secret
```

### `.github/workflows/deploy.yml` — runs on push to `main` after CI
```yaml
on:
  push:
    branches: [main]

jobs:
  deploy-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: '1.1' }
      - run: bun install --frozen-lockfile
      - run: bun run build:client
        env:
          VITE_API_URL: ${{ secrets.GCP_API_GATEWAY_URL }}
      - run: bunx vercel deploy dist/client --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT }}/mission-control-api
      - run: |
          gcloud run deploy mission-control-api \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/mission-control-api \
            --region australia-southeast1 \
            --platform managed \
            --allow-unauthenticated \
            --set-secrets DATABASE_URL=DATABASE_URL:latest,BETTER_AUTH_SECRET=BETTER_AUTH_SECRET:latest
```

---

## 9. Type Safety: Single Source of Truth

The `shared/` workspace is the only place types are defined. Both `server/` and `client/` import from it — nothing is duplicated or hand-written.

### Flow

```
shared/schema/  (Drizzle tables)
      │
      │  $inferSelect / $inferInsert
      ▼
TypeScript types  ──────────────────────────────────┐
      │                                              │
      ▼                                              ▼
shared/dtos.ts                              shared/contracts.ts
Pick<Mission, 'id'|'title'|...>             z.object({ title: z.string(), ... })
(API response shapes)                       (Zod request schemas)
      │                                              │
      │                                              │  z.infer<Schema>
   ┌──┴──────────────────┐               ┌───────────┴───────────┐
   │                     │               │                       │
   ▼                     ▼               ▼                       ▼
server/ routes       client/           server/ routes        client/ forms
returns MissionDto   useQuery          safeParse(req.body)   zodResolver(Schema)
                     <MissionDto[]>
```

### Rules

| Rule | Enforced by |
|---|---|
| No `as any` | `biome noExplicitAny: "error"` |
| DB types via `$inferSelect`/`$inferInsert` only | Code review + tsc |
| Compose with `Pick`/`Omit`/`&`, never redefine | Type skill + tsc |
| `safeParse` at all API boundaries | Code review |
| Branded IDs prevent cross-type ID confusion | tsc structural checks |

### Branded IDs (`shared/branded-types.ts`)

```typescript
type MissionId = string & { readonly __brand: 'MissionId' }
type OrgId     = string & { readonly __brand: 'OrgId' }
// passing orgId where missionId is expected → compile error
```

### Ripple effect guarantee

Rename a column in `shared/schema/missions.ts` → TypeScript errors surface immediately in:
- `shared/dtos.ts` (response shape)
- `server/routes/missions.ts` (query + response)
- `client/hooks/useMissions.ts` (query type)

Caught by `bun run typecheck` before any code ships.

---

## Critical Files (once implementation starts)

- [docs/mission-control.md](docs/mission-control.md) — DB schema, lifecycle rules, acceptance criteria
- [docs/plans/2026-03-10-auth-design.md](docs/plans/2026-03-10-auth-design.md) — auth middleware pattern, invite flow, org isolation
- [docs/auto-matching-engine.md](docs/auto-matching-engine.md) — scoring formula for `server/services/matcher.ts`
- `shared/schema/` — Drizzle tables (source of truth for all types)
- `server/app.ts` — Express app factory (must be importable without listen for tests)
- `tests/setup.ts` — test DB lifecycle (all integration tests depend on this)

## Verification

1. `bun run docker:up && bun run db:migrate && bun run db:seed && bun run dev` — full local stack starts
2. `bun run check` — full quality gate passes locally
3. `bun test tests/integration/tenancy.test.ts` — all cross-org 404 assertions pass
4. `bunx playwright test` — 3 E2E journeys pass against running dev stack
5. Push to `main` → CI passes → Vercel + Cloud Run both deploy successfully
