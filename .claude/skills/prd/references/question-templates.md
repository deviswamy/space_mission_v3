# AskUserQuestion Templates

Reusable question patterns for PRD clarification.

---

## Tool Constraints

- 1-4 questions per call
- 2-4 options per question
- Headers max 12 characters
- Users can always select "Other" for custom input

---

## Core Questions

### Goal Clarification

```json
{
  "question": "What is the primary goal of this feature?",
  "header": "Goal",
  "multiSelect": false,
  "options": [
    { "label": "Solve pain point", "description": "Fix a specific user problem or frustration" },
    { "label": "New capability", "description": "Enable something users couldn't do before" },
    { "label": "Improve process", "description": "Make an existing workflow better/faster" }
  ]
}
```

### User Identification

```json
{
  "question": "Who is the primary user?",
  "header": "User",
  "multiSelect": false,
  "options": [
    { "label": "End users", "description": "In-app experience for customers" },
    { "label": "Developers", "description": "Internal tooling, APIs, or SDK" },
    { "label": "Admins", "description": "System management and configuration" },
    { "label": "Multiple", "description": "Both end users and developers" }
  ]
}
```

### Scope Sizing

```json
{
  "question": "What's the minimum viable scope?",
  "header": "Scope",
  "multiSelect": false,
  "options": [
    { "label": "Small (2-4 stories)", "description": "Single feature, 1-2 screens, no major backend" },
    { "label": "Medium (4-8 stories)", "description": "Feature set, multiple screens, backend + UI" },
    { "label": "Large (split phases)", "description": "Major system, requires phased rollout" }
  ]
}
```

---

## Layer Questions

### Full Stack vs Partial

```json
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
```

### Data Scope

```json
{
  "question": "Should this apply per-user or globally?",
  "header": "Data Scope",
  "multiSelect": false,
  "options": [
    { "label": "Per-user", "description": "Each user has their own data/settings" },
    { "label": "Global", "description": "Shared across all users" },
    { "label": "Team/org", "description": "Shared within a team or organization" }
  ]
}
```

---

## Feature-Specific Questions

### Persistence

```json
{
  "question": "How should this data be stored?",
  "header": "Storage",
  "multiSelect": false,
  "options": [
    { "label": "Database", "description": "Persist across sessions, queryable" },
    { "label": "Local storage", "description": "Client-side only, per-device" },
    { "label": "Session only", "description": "Lost on refresh/logout" }
  ]
}
```

### Sorting/Ordering

```json
{
  "question": "Should this affect sort order?",
  "header": "Sorting",
  "multiSelect": false,
  "options": [
    { "label": "Yes, auto-sort", "description": "Items ordered automatically by this value" },
    { "label": "No, manual order", "description": "User controls order separately" },
    { "label": "Optional", "description": "User can toggle sorting on/off" }
  ]
}
```

### Visibility

```json
{
  "question": "Who should see this feature?",
  "header": "Visibility",
  "multiSelect": false,
  "options": [
    { "label": "All users", "description": "Available to everyone" },
    { "label": "Premium only", "description": "Requires paid subscription" },
    { "label": "Feature flag", "description": "Gradual rollout, toggleable" }
  ]
}
```

---

## Prioritization Questions

Use when input is rough notes with multiple ideas:

```json
{
  "question": "If you could only ship ONE of these, which would it be?",
  "header": "Priority",
  "multiSelect": false,
  "options": [
    { "label": "[Feature A]", "description": "Brief description" },
    { "label": "[Feature B]", "description": "Brief description" },
    { "label": "[Feature C]", "description": "Brief description" }
  ]
}
```

---

## When to Ask

| Input Format | Questions Needed |
| -------------- | ------------------ |
| Feature description | 2-3 questions (scope, layers, key decisions) |
| Existing PRD markdown | 0 questions (skip to validation) |
| Requirements dump | 2-3 questions (prioritization, scope) |
| Rough notes | 3-4 questions (prioritization + clarification) |

**Key principle**: Questions should uncover story-sizing implications:

- "How large is the feature?" → affects story count
- "What's the minimum viable scope?" → prevents over-scoping
- "Are there dependencies?" → affects ordering
