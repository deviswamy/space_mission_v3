# Feature 1 — Tenant-Aware Foundation: Implementation Plan

**Context:** The auth design doc (`docs/plans/2026-03-10-auth-design.md`) specifies the full auth+foundation stack. The codebase is ~20% complete — schema tables exist, middleware stubs exist, but all implementation logic is TODO. This plan completes GitHub issues #1–4 (Feature 1: Tenant-Aware Foundation). Feature 2 auth stories (#5–8) are listed below as the natural next layer but are out of scope for immediate execution.

---

## Story 1.1 — Database Schema (issue #2)

**Goal:** better-auth configured with additionalFields, migration generated and applied.

### Tasks

**T1.1.1 — Add `additionalFields` to `server/lib/auth.ts`**
- Add `orgId`, `role`, `mustChangePassword` inside `user.additionalFields`
- Export `SessionUser = typeof auth.$Infer.Session.user`
- Reference: auth design doc lines 84–108

**T1.1.2 — Add `NewUser` insert type to `shared/schema/auth.ts`**
- Export `type NewUser = typeof users.$inferInsert`
- Needed by seed and invite route

**T1.1.3 — Generate Drizzle migration**
```bash
bun db:generate
```
- Verify migration file created in `server/db/migrations/`

**T1.1.4 — Run migration against dev DB**
```bash
docker compose up -d
bun db:migrate
```
- Confirm all 4 better-auth tables + orgs + skills created

**Critical files:**
- `server/lib/auth.ts`
- `shared/schema/auth.ts`
- `server/db/migrations/` (generated)

---

## Story 1.2 — Seed Script (issue #3)

**Goal:** 2 orgs, 1 director each, 5 skills each. Idempotent (delete-then-insert).

### Tasks

**T1.2.1 — Install argon2**
```bash
cd server && bun add @node-rs/argon2
```

**T1.2.2 — Implement `server/db/seed.ts`**
- Insert orgs: `Orion Space Agency` (slug: orion), `Apollo Collective` (slug: apollo)
- Insert directors with `hash('Director@Orion1')` and `hash('Director@Apollo1')`
  - `director@orion.space` → orgId: orionId, role: director, mustChangePassword: false
  - `director@apollo.space` → orgId: apolloId, role: director, mustChangePassword: false
- Insert 5 skills per org (e.g. EVA Operations, Navigation, Medical, Engineering, Communications)
- Wrap all inserts in a transaction; clear tables on re-run for idempotency
- Reference: auth design doc lines 256–271

**T1.2.3 — Add seed script to `server/package.json`**
```json
"db:seed": "bun db/seed.ts"
```

**T1.2.4 — Verify seed runs**
```bash
cd server && bun db:seed
```
- Check rows exist in `user`, `orgs`, `skills` tables

**Critical files:**
- `server/db/seed.ts`
- `server/package.json`

---

## Story 1.3 — Org-Scoped API Middleware (issue #4)

**Goal:** All protected routes enforce session, role, and org isolation.

### Tasks

**T1.3.1 — Implement `server/lib/auth.ts` handler export**
- Export `authHandler = auth.handler` for use in routes
- Confirm `emailAndPassword: { enabled: true }` is set

**T1.3.2 — Wire better-auth handler in `server/routes/auth.ts`**
- Replace 501 stub with: `app.all('/api/auth/*', toNodeHandler(auth.handler))`
- Uses better-auth's built-in login/logout/session endpoints

**T1.3.3 — Implement `server/middleware/requireAuth.ts`**
- Call `auth.api.getSession({ headers: req.headers })`
- Return 401 `{ error: 'Unauthorized' }` if no session
- Return 403 `{ error: 'PASSWORD_CHANGE_REQUIRED' }` if `mustChangePassword && path !== '/api/auth/change-password'`
- Attach `session.user` to `req.identity`
- Update Express.Request namespace declaration: `identity: SessionUser` (not optional)
- Reference: auth design doc lines 158–192

**T1.3.4 — Add `POST /api/auth/change-password` endpoint**
- New file: `server/routes/auth-change-password.ts`
- Accept `{ newPassword: string }`, validate with Zod (min 8 chars)
- Hash with argon2, update `user.passwordHash` + `mustChangePassword: false` where `id = req.identity.id`
- Protected by `requireAuth` (but skipped from mustChangePassword gate — already handled in middleware)

**T1.3.5 — Apply org-isolation pattern to all resource handlers**
- Every resource query must include `eq(table.orgId, req.identity.orgId)`
- Cross-org returns 404 (not 403)
- Document the pattern in a comment in `server/routes/index.ts`

**T1.3.6 — Wire `requireAuth` into protected routes in `server/routes/index.ts`**
- Apply `requireAuth` to all non-auth routes
- Apply `requireRole('director')` to admin routes

**Critical files:**
- `server/middleware/requireAuth.ts`
- `server/routes/auth.ts`
- `server/routes/auth-change-password.ts` (new)
- `server/routes/index.ts`

---

## Feature 2 Auth Stories (reference only — not in scope for this execution)

These are the next natural layer after Feature 1 is complete:

| Issue | Story | Key work |
|-------|-------|----------|
| #6 | Story 2.1 — Login Page | `client/src/pages/LoginPage.tsx`, `authClient.signIn.email()`, redirect on success |
| #7 | Story 2.2 — Forced Password Change | `client/src/pages/ChangePasswordPage.tsx`, `AuthGuard.tsx`, mustChangePassword redirect |
| #8 | Story 2.3 — Director Invite Flow | `server/routes/admin/invite.ts`, hash temp password, insert user, `InviteUserSchema` validation |
| #5 | Feature 2 — Auth | Frontend auth client in `client/src/lib/auth.ts` |

---

## Execution Order

```
T1.1.1 → T1.1.2 → T1.1.3 → T1.1.4   (schema first, migration second)
       ↓
T1.2.1 → T1.2.2 → T1.2.3 → T1.2.4   (seed after migration)
       ↓
T1.3.1 → T1.3.2 → T1.3.3 → T1.3.4 → T1.3.5 → T1.3.6   (middleware last)
```

---

## Verification

1. `bun db:generate` — migration file created
2. `bun db:migrate` — all tables present in psql
3. `bun db:seed` — 2 orgs, 2 directors, 10 skills in DB
4. `curl -X POST /api/auth/sign-in/email` with director@orion.space creds → 200 + session cookie
5. `curl /api/orgs` without cookie → 401
6. `curl /api/orgs` with orion cookie → sees only orion data
7. `curl /api/orgs` with apollo cookie → sees only apollo data (404 on orion resources)
8. Login with a new invited user (mustChangePassword: true) → 403 PASSWORD_CHANGE_REQUIRED on all routes except /api/auth/change-password
