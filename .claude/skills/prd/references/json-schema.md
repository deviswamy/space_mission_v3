# prd.json Schema Reference

Exact format required for Ralph autonomous execution.

---

## Schema

```json
{
  "project": "string",
  "branchName": "string",
  "description": "string",
  "userStories": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "acceptanceCriteria": ["string"],
      "priority": "number",
      "passes": false,
      "notes": ""
    }
  ]
}
```

---

## Field Specifications

### Root Fields

| Field | Type | Required | Format |
| ------- | ------ | ---------- | -------- |
| `project` | string | Yes | Project name (e.g., "TaskApp", "KinkTech") |
| `branchName` | string | Yes | `ralph/[feature-name-kebab-case]` |
| `description` | string | Yes | Feature description from PRD intro |
| `userStories` | array | Yes | Ordered list of story objects |

### Story Fields

| Field | Type | Required | Format |
| ------- | ------ | ---------- | -------- |
| `id` | string | Yes | Sequential: `US-001`, `US-002`, etc. |
| `title` | string | Yes | 3-8 words, action-oriented |
| `description` | string | Yes | "As a [user], I want [feature] so that [benefit]" |
| `acceptanceCriteria` | array | Yes | Verifiable criteria, strings |
| `priority` | number | Yes | Based on dependency order (1 = first) |
| `passes` | boolean | Yes | Always `false` initially |
| `notes` | string | Yes | Always `""` initially |

---

## Conversion Rules

### From PRD Markdown to JSON

1. **Each user story becomes one JSON entry** (in order)
2. **IDs**: Sequential (US-001, US-002, etc.)
3. **Priority**: Based on dependency order (first story = priority 1)
4. **All stories**: `passes: false` and empty `notes: ""`
5. **branchName**: Kebab-case from feature name, prefixed with `ralph/`
6. **acceptanceCriteria**: Array of strings from markdown bullets

### Required Criteria Additions

**For ALL stories**:

- Add `"Typecheck passes"` as final criterion if missing

**For stories with UI changes**:

- Add `"Verify in browser using dev-browser skill"`

**For stories with verifiable logic**:

- Add `"Tests pass"` if applicable

---

## Examples

### Minimal Story

```json
{
  "id": "US-001",
  "title": "Add status column to database",
  "description": "As a developer, I need to store task status.",
  "acceptanceCriteria": [
    "Add status column: 'pending' | 'complete' (default 'pending')",
    "Run migration successfully",
    "Typecheck passes"
  ],
  "priority": 1,
  "passes": false,
  "notes": ""
}
```

### UI Story

```json
{
  "id": "US-002",
  "title": "Display status badge on tasks",
  "description": "As a user, I want to see task status at a glance.",
  "acceptanceCriteria": [
    "Status badge visible on each task card",
    "Green for complete, gray for pending",
    "Typecheck passes",
    "Verify in browser using dev-browser skill"
  ],
  "priority": 2,
  "passes": false,
  "notes": ""
}
```

### Full prd.json

```json
{
  "project": "TaskApp",
  "branchName": "ralph/task-status-tracking",
  "description": "Add status tracking to tasks with visual indicators.",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add status column to database",
      "description": "As a developer, I need to store task status.",
      "acceptanceCriteria": [
        "Add status column: 'pending' | 'complete' (default 'pending')",
        "Run migration successfully",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display status badge on tasks",
      "description": "As a user, I want to see task status at a glance.",
      "acceptanceCriteria": [
        "Status badge visible on each task card",
        "Green for complete, gray for pending",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-003",
      "title": "Toggle task status",
      "description": "As a user, I want to mark tasks complete.",
      "acceptanceCriteria": [
        "Click/tap badge to toggle status",
        "Optimistic UI update",
        "Persist to database",
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

## ralph.sh Compatibility

This format is fully compatible with `ralph.sh`. No changes to:

- JSON structure
- Field names or types
- Priority assignment logic
- Acceptance criteria format
- Story schema

---

## File Location

Save to: `ralph/tasks/prd.json`

Optional PRD markdown: `ralph/tasks/prd-[feature-name].md`
