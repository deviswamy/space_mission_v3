# Complete PRD Workflow Example

End-to-end example from user input to prd.json output.

---

## User Input

```text
Feature: Add priority filtering to tasks

Users should be able to see only high-priority tasks. Priority
should have three levels: high, medium, low. Persist in database.
```

---

## Phase 1: Input Detection

**Detected**: Feature description (informal, clear scope)

**Classification reasoning**:

- Narrative prose → Not existing PRD
- Has specific feature idea → Not rough notes
- Clear scope (priority levels defined) → Minimal clarification needed

---

## Phase 2: Clarifying Questions

Using AskUserQuestion tool:

```json
{
  "questions": [
    {
      "question": "Should filtering apply only to user's own tasks or all tasks?",
      "header": "Scope",
      "multiSelect": false,
      "options": [
        { "label": "Own tasks only", "description": "Filter applies per-user" },
        { "label": "All tasks", "description": "Global filter across all users" }
      ]
    },
    {
      "question": "Should priority affect sort order within a view?",
      "header": "Sorting",
      "multiSelect": false,
      "options": [
        { "label": "Yes, sort by priority", "description": "High priority items appear first" },
        { "label": "No, manual order", "description": "User controls order separately" }
      ]
    },
    {
      "question": "Does this feature need a UI or is it backend/API only?",
      "header": "Layers",
      "multiSelect": false,
      "options": [
        { "label": "Full stack (Recommended)", "description": "Backend + UI components" },
        { "label": "Backend only", "description": "API/database changes, no UI" },
        { "label": "UI only", "description": "Frontend changes, backend exists" }
      ]
    }
  ]
}
```

**User answers**: Own tasks only, Yes sort by priority, Full stack

---

## Phase 3: Story Structure

```markdown
# PRD: Task Priority Filtering

## Introduction
Add priority levels (high/medium/low) to tasks with visual filtering
and sorting so users can focus on what matters most.

## Goals
- Allow assigning priority to tasks
- Filter and sort by priority
- Visual indicators for priority
- Default new tasks to medium priority

## User Stories

### US-001: Add priority field to schema
**Description:** As a developer, I need to store task priority.
**Acceptance Criteria:**
- [ ] Add priority column: 'high' | 'medium' | 'low' (default 'medium')
- [ ] Run migration
- [ ] Typecheck passes

### US-002: Display priority badge
**Description:** As a user, I want to see task priority at a glance.
**Acceptance Criteria:**
- [ ] Priority badge on each task (colored: red=high, yellow=med, gray=low)
- [ ] Visible without hovering
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Priority filter dropdown
**Description:** As a user, I want to filter tasks by priority.
**Acceptance Criteria:**
- [ ] Filter dropdown: All | High | Medium | Low
- [ ] Filter persists in URL
- [ ] Empty state when no matches
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Non-Goals
- Priority notifications/alerts
- Priority-based due date automation
- Bulk priority editing

## Open Questions
- None (all clarified via AskUserQuestion)
```

---

## Phase 4: Validation

| Story | Assessment | Result |
| ----- | ---------- | ------ |
| US-001 | Small, database only, 3 criteria | ✅ 1 iteration |
| US-002 | Small, UI only, 4 criteria | ✅ 1 iteration |
| US-003 | Small, filter logic, 5 criteria | ✅ 1 iteration |

**Dependency check**:

- US-001 (schema) → US-002 (UI needs field) → US-003 (filter needs UI) ✅

All stories properly sized and ordered.

---

## Phase 5: Output prd.json

```json
{
  "project": "TaskApp",
  "branchName": "ralph/task-priority-filtering",
  "description": "Add priority levels (high/medium/low) to tasks with visual filtering and sorting so users can focus on what matters most.",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add priority field to schema",
      "description": "As a developer, I need to store task priority.",
      "acceptanceCriteria": [
        "Add priority column: 'high' | 'medium' | 'low' (default 'medium')",
        "Run migration",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display priority badge",
      "description": "As a user, I want to see task priority at a glance.",
      "acceptanceCriteria": [
        "Priority badge on each task (colored: red=high, yellow=med, gray=low)",
        "Visible without hovering",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-003",
      "title": "Priority filter dropdown",
      "description": "As a user, I want to filter tasks by priority.",
      "acceptanceCriteria": [
        "Filter dropdown: All | High | Medium | Low",
        "Filter persists in URL",
        "Empty state when no matches",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 3,
      "passes": false,
      "notes": ""
    }
  ]
}
```

---

## Saved Files

- **PRD markdown** (optional): `ralph/tasks/prd-task-priority-filtering.md`
- **prd.json** (required): `ralph/tasks/prd.json`

---

## Splitting Large Features

If a feature is too big for one PRD, split into phases:

**Original requirement**:
> "Build custom session system with templates, sharing, and history tracking"

**Split into two phases**:

**Phase 1: Custom Sessions (Basic)** → `prd-custom-sessions-v1.json`

- US-001: Add session schema
- US-002: Session builder UI
- US-003: Save custom session

**Phase 2: Advanced Custom Sessions** → `prd-custom-sessions-v2.json`

- US-004: Session templates library
- US-005: Share sessions with partner
- US-006: Session history tracking

Each phase gets its own prd.json, executed sequentially.
