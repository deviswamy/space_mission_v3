# Mission Control — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-10
**Status:** Ready for implementation

---

## Overview

Mission Control is a multi-tenant B2B SaaS platform for space organisations to manage crew assignments, build skill profiles, and auto-match crew to missions. It eliminates manual cross-referencing of skills, availability, and commitments across multi-org environments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (SPA) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | Session-based (bcrypt + express-session) |

---

## Roles & Permissions

| Role | Capabilities |
|---|---|
| `director` | Full access: manage org, invite users, approve missions, view all crew & assignments |
| `mission_lead` | Create/edit/submit missions, view assignment results |
| `crew_member` | Edit own profile (skills, availability, experience), accept/reject own assignments |

---

## Mission Lifecycle

```text
draft → submitted → approved → active → completed
                 ↘ rejected → draft
```

- `mission_lead` or `director` creates missions (starts as `draft`)
- `mission_lead` submits → status becomes `submitted`, auto-matcher runs
- `director` approves → `approved`, or rejects → `rejected` (returns to `draft`)
- `director` marks approved mission → `active`
- `director` marks active mission → `completed`

---

## Feature 1 — Tenant-Aware Foundation

**Goal:** DB schema, org isolation, seeded data

### Schema — Tenant Core

```sql
orgs
  id uuid PK
  name text
  slug text UNIQUE
  created_at timestamptz

users
  id uuid PK
  org_id uuid FK → orgs.id
  email text UNIQUE
  password_hash text
  role enum('director','mission_lead','crew_member')
  must_change_password boolean DEFAULT true
  created_at timestamptz

skills
  id uuid PK
  org_id uuid FK → orgs.id
  name text
  UNIQUE(org_id, name)
```

### Seeded Orgs

| Org | Slug | Director Email | Password |
| --- | --- | --- | --- |
| Orion Space | `orion` | `director@orion.space` | `Director@Orion1` |
| Apollo Space | `apollo` | `director@apollo.space` | `Director@Apollo1` |

Seeded skills per org: Piloting, EVA, Medical, Engineering, Navigation

### Story 1.1 — Database Schema

**As a:** system
**I want:** a complete PostgreSQL schema with all tables
**So that:** all features have a reliable, org-isolated data layer

**Acceptance criteria:**

- All tables defined with correct types, foreign keys, and constraints
- `org_id` present on all tenant-scoped tables
- Enum types: `role`, `experience_level`, `mission_status`, `assignment_status`
- Migration runnable with `bun run db:migrate`

**UI Pages:** None

---

### Story 1.2 — Seed Script

**As a:** developer / QA
**I want:** 2 seeded orgs with director accounts and a set of sample skills
**So that:** the app can be tested without manual setup

**Acceptance criteria:**

- 2 orgs created: Orion Space (`orion`), Apollo Space (`apollo`)
- Each has a director user with known credentials (see Seeded Orgs table)
- `must_change_password = false` for seeded directors
- 5 skills seeded per org: Piloting, EVA, Medical, Engineering, Navigation
- Seed runnable with `bun run db:seed`

**UI Pages:** None

---

### Story 1.3 — Org-Scoped API Middleware

**As a:** system
**I want:** every API request validated against the authenticated user's org
**So that:** cross-org data access is impossible

**Acceptance criteria:**

- All protected routes require a valid session; unauthenticated returns 401
- Resource lookups include `org_id = session.user.org_id` in WHERE clause
- Cross-org access returns HTTP 404 (not 403)
- Middleware applied on all `/api` routes except `/api/auth`

**UI Pages:** None

---

## Feature 2 — Authentication

**Goal:** Login, session, first-login password change, invite system

### Story 2.1 — Login Page

**As a:** any user
**I want:** to sign in with my email and password
**So that:** I can access my organisation's Mission Control

**Acceptance criteria:**

- Login form: email field, password field, submit button
- On success: redirect to `/dashboard`
- On failure: show error message "Invalid email or password"
- If `must_change_password = true`: redirect to `/change-password` instead
- Session persists across page refreshes

**UI Pages:** `/login`

---

### Story 2.2 — Forced Password Change

**As a:** newly invited user
**I want:** to be forced to change my temp password on first login
**So that:** my account is secure from the start

**Acceptance criteria:**

- `/change-password` requires current session + `must_change_password = true`
- Form: new password field, confirm password field
- Password must be at least 8 characters
- On success: `must_change_password` set to `false`, redirect to `/dashboard`
- User cannot access other pages until password is changed

**UI Pages:** `/change-password`

---

### Story 2.3 — Director Invite Flow

**As a:** director
**I want:** to invite mission leads and crew members to my org
**So that:** they can log in and use the platform

**Acceptance criteria:**

- Director can open an invite form: email, role (mission_lead / crew_member), temporary password
- On submit: user record created with `org_id = director's org`, `must_change_password = true`
- If email already exists in any org: show error "Email already in use"
- Invited user listed in crew roster immediately after invite
- Director cannot invite another director

**UI Pages:** `/admin/invite` (accessible as modal from `/crew`)

---

## Feature 3 — Mission Management

**Goal:** Full mission lifecycle from draft to completion

### Schema — Missions

```sql
missions
  id uuid PK
  org_id uuid FK → orgs.id
  title text
  description text
  status enum('draft','submitted','approved','active','completed','rejected')
  start_date date
  end_date date
  created_by uuid FK → users.id
  created_at timestamptz
  updated_at timestamptz

mission_skill_requirements
  id uuid PK
  mission_id uuid FK → missions.id
  skill_id uuid FK → skills.id
  count_required integer
```

### Story 3.1 — Mission CRUD

**As a:** director or mission_lead
**I want:** to create, view, edit, and delete missions
**So that:** mission planning is tracked in the system

**Acceptance criteria:**

- Mission list page shows all org missions with status badge
- Create form: title (required), description, start date, end date, required skills (select from org skills + count per skill)
- Edit works for missions in `draft` status only
- Delete works for missions in `draft` status only
- Mission detail page shows all fields + current status

**UI Pages:** `/missions`, `/missions/new`, `/missions/:id`, `/missions/:id/edit`

---

### Story 3.2 — Mission Submission

**As a:** mission_lead or director
**I want:** to submit a mission for approval
**So that:** the auto-matcher runs and the director can review it

**Acceptance criteria:**

- "Submit Mission" button visible on `/missions/:id` for `draft` missions
- On submit: status changes to `submitted`, auto-matcher runs immediately
- All in a single DB transaction; if matcher fails, submission rolls back
- Success message: "Mission submitted. Crew auto-matching complete."
- Button disabled if mission has no required skills defined

**UI Pages:** `/missions/:id` (button + status update)

---

### Story 3.3 — Mission Approval

**As a:** director
**I want:** to approve or reject submitted missions
**So that:** only vetted missions proceed to crew assignment

**Acceptance criteria:**

- "Approve" and "Reject" buttons visible on `/missions/:id` for `submitted` missions (director only)
- On approve: status → `approved`
- On reject: status → `rejected`; mission lead can edit and re-submit
- Mission lead cannot see Approve/Reject buttons

**UI Pages:** `/missions/:id` (director view)

---

### Story 3.4 — Mission Lifecycle Advancement

**As a:** director
**I want:** to mark approved missions as active, and active missions as completed
**So that:** the full mission lifecycle is tracked

**Acceptance criteria:**

- "Mark Active" button on `approved` missions (director only)
- "Mark Completed" button on `active` missions (director only)
- Status transitions: `approved` → `active` → `completed`
- Completed missions are read-only

**UI Pages:** `/missions/:id` (status controls)

---

## Feature 4 — Crew Management

**Goal:** Director manages crew roster; crew manage own profiles and assignments

### Schema — Crew & Assignments

```sql
crew_skills
  id uuid PK
  user_id uuid FK → users.id
  skill_id uuid FK → skills.id
  experience_level enum('junior','senior','lead')
  UNIQUE(user_id, skill_id)

crew_availability
  id uuid PK
  user_id uuid FK → users.id
  start_date date
  end_date date
  is_available boolean DEFAULT true

assignments
  id uuid PK
  mission_id uuid FK → missions.id
  user_id uuid FK → users.id
  skill_id uuid FK → skills.id
  status enum('pending','accepted','rejected')
  assigned_at timestamptz
  responded_at timestamptz
```

### Story 4.1 — Crew Roster (Director)

**As a:** director
**I want:** to view all crew members in my org with their skills and availability
**So that:** I have visibility of who is available for missions

**Acceptance criteria:**

- List of all users in org (excluding director)
- Shows: email, role, skills (with experience level), availability status
- "Invite" button opens the invite modal
- Filterable by role

**UI Pages:** `/crew`

---

### Story 4.2 — Crew Profile Edit

**As a:** crew_member
**I want:** to edit my own profile including skills, availability, and experience level
**So that:** the auto-matcher can find me for suitable missions

**Acceptance criteria:**

- Profile page shows: email (read-only), skills (add/remove from org skill list with experience level), availability date ranges (add/remove)
- Skills selected from org-level skill taxonomy (not freeform)
- Can add multiple availability windows
- Changes saved on submit

**UI Pages:** `/profile`

---

### Story 4.3 — Assignment Accept/Reject (Crew)

**As a:** crew_member
**I want:** to accept or reject mission assignments
**So that:** mission leads know my availability and commitment

**Acceptance criteria:**

- `/my-assignments` lists all assignments for the logged-in crew member
- Shows: mission title, dates, skill slot, status badge
- "Accept" and "Reject" buttons for `pending` assignments
- On action: status updates, response timestamp recorded
- Accepted/rejected assignments shown as read-only history

**UI Pages:** `/my-assignments`

---

### Story 4.4 — Assignment Status View (Director + Mission Lead)

**As a:** director or mission_lead
**I want:** to see which crew members accepted or rejected their assignments for a mission
**So that:** I can track crew commitment and follow up if needed

**Acceptance criteria:**

- `/missions/:id/assignments` shows all assignments for that mission
- Columns: crew email, skill slot, experience level, status (pending/accepted/rejected), responded at
- Grouped by skill slot
- Unassigned slots shown as "No match found"
- Accessible to director and mission_lead only; crew cannot access

**UI Pages:** `/missions/:id/assignments`

---

## Feature 5 — Auto-Matching Engine

**Goal:** Automatically assign best-fit crew when mission is submitted

### Algorithm

**Input:** `mission_id`
**Output:** Assignment records (status: `pending`) for best-fit crew

1. For each skill slot in `mission_skill_requirements`:
   - Find all crew in the same org with that skill (`crew_skills`)
   - Filter: crew has availability covering the mission dates (`is_available = true`)
   - Rank candidates: `lead` > `senior` > `junior`
   - Assign top N candidates (N = `count_required`) → create `assignment` records
2. If fewer than N candidates found, assign all available (partial fill)

### Story 5.1 — Matching Service

**As a:** system
**I want:** a matching function that finds best-fit crew for a mission
**So that:** assignments are made objectively and automatically

**Acceptance criteria:**

- Function: `matchCrew(missionId, db)` → `[{userId, skillId, experienceLevel}]`
- Filters by org, date overlap, and `is_available = true`
- Ranks: lead=3, senior=2, junior=1
- Returns array of assignment objects; does not write to DB
- Pure service — no HTTP, callable internally

**UI Pages:** None

---

### Story 5.2 — Auto-Trigger on Mission Submit

**As a:** system
**I want:** the matcher to run automatically when a mission is submitted
**So that:** crew assignments are ready for review immediately

**Acceptance criteria:**

- `POST /api/missions/:id/submit` runs `matchCrew`, inserts assignment rows
- All in a single DB transaction; failure rolls back submission
- Response includes updated mission object + assignments array

**UI Pages:** None (triggered by Story 3.2 button)

---

### Story 5.3 — Match Results UI

**As a:** director or mission_lead
**I want:** to see the auto-matched assignments on the mission page
**So that:** I can review who was assigned and their current response

**Acceptance criteria:**

- Assignment results at `/missions/:id/assignments` (shared with Story 4.4)
- Status badges: pending=yellow, accepted=green, rejected=red
- Unassigned slots shown as "No match found" in red
- Accessible immediately after submission

**UI Pages:** `/missions/:id/assignments`

---

## Feature 6 — Dashboard

**Goal:** Role-specific landing page with org-level metrics

### Story 6.1 — Director Dashboard

**As a:** director
**I want:** an overview of my org's mission and crew status
**So that:** I can take action on pending items quickly

**Acceptance criteria:**

- Metric cards: active missions count, pending approvals count, total crew count, unassigned slots count
- "Pending Approvals" section: submitted missions with inline Approve/Reject
- "Active Missions" section: title, dates, assignment summary (X/Y accepted)
- Links to `/missions` and `/crew`

**UI Pages:** `/dashboard` (director view)

---

### Story 6.2 — Mission Lead Dashboard

**As a:** mission_lead
**I want:** to see my missions and their assignment status at a glance
**So that:** I can track progress without navigating every mission

**Acceptance criteria:**

- My Missions section: missions I created with status badges
- Quick "Submit" button for draft missions
- Assignment summary per submitted/approved mission: X accepted, Y pending, Z rejected

**UI Pages:** `/dashboard` (mission_lead view)

---

### Story 6.3 — Crew Dashboard

**As a:** crew_member
**I want:** to see my pending assignments and my availability status
**So that:** I can act on assignments without hunting for them

**Acceptance criteria:**

- "Pending Assignments" section: list with Accept/Reject buttons
- "My Assignment History": past accepted/rejected assignments
- "My Availability": current date ranges summary, link to `/profile`

**UI Pages:** `/dashboard` (crew_member view)

---

## UI Page Summary

| Page | Route | Roles |
| --- | --- | --- |
| Login | `/login` | All |
| Force password change | `/change-password` | All (first login) |
| Dashboard | `/dashboard` | All (role-specific) |
| Mission list | `/missions` | Director, Mission Lead |
| Create mission | `/missions/new` | Director, Mission Lead |
| Mission detail | `/missions/:id` | Director, Mission Lead |
| Edit mission | `/missions/:id/edit` | Director, Mission Lead |
| Assignment results | `/missions/:id/assignments` | Director, Mission Lead |
| Crew roster | `/crew` | Director |
| Invite user | `/admin/invite` | Director |
| My profile | `/profile` | Crew Member |
| My assignments | `/my-assignments` | Crew Member |

---

## Implementation Order

1. DB schema + enum types (Story 1.1)
2. Seed script — 2 orgs, directors, skills (Story 1.2)
3. Express server + session middleware (Story 1.3 infrastructure)
4. Org-scoped middleware + 404 enforcement (Story 1.3)
5. Login API + Login page (Story 2.1)
6. Force password change API + page (Story 2.2)
7. Invite API + invite modal (Story 2.3)
8. Mission CRUD API + pages (Story 3.1)
9. Crew profile API + page (Story 4.2)
10. Crew roster page (Story 4.1)
11. Auto-matching service (Story 5.1)
12. Mission submit API + auto-trigger (Stories 3.2, 5.2)
13. Assignment results page (Stories 4.4, 5.3)
14. Assignment accept/reject API + crew page (Story 4.3)
15. Mission approval API (Story 3.3)
16. Mission lifecycle advancement API (Story 3.4)
17. Dashboards — all 3 roles (Stories 6.1–6.3)

---

## Out of Scope (MVP)

- Email notifications (in-app only)
- Multi-org user membership
- Director self-registration (directors are seeded)
- Audit logs
- File uploads
- Mobile app
