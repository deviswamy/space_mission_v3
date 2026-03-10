---
name: prd
description: "Generate prd.json specifications from any input source (feature description, existing PRD, notes, requirements). Creates ready-to-execute JSON specs for Ralph autonomous agent system. Use when you need to: (1) plan and spec a feature from scratch, (2) convert existing PRDs to executable format, (3) transform project requirements into story-based specifications. Triggers on: create a prd, write prd for, plan this feature, requirements for, convert this prd, turn into ralph format, create prd.json."
---

# PRD Generator → prd.json

Generate executable specifications (prd.json) from any input format for Ralph autonomous execution.

---

## The Critical Constraint

**Each story must be completable in ONE Ralph iteration (one context window).**

Ralph spawns fresh Claude instances per story with no memory of prior work. If a story is too big, the LLM runs out of context before finishing and produces broken code.

This constraint drives ALL decisions in this skill.

---

## 4-Phase Workflow

| Phase                | Purpose                                           | Key Decision                     |
| -------------------- | ------------------------------------------------- | -------------------------------- |
| 1. Input Detection   | Classify input, determine if clarification needed | Skip questions for existing PRDs |
| 2. Structure Stories | Convert requirements to right-sized user stories  | Each story = 1 context window    |
| 3. Validate Sizing   | Check all stories fit constraint                  | Split oversized stories          |
| 4. Output JSON       | Generate prd.json                                 | Exact schema for ralph.sh        |

---

## Phase 1: Input Detection & Clarification

### Classify Input Format

| Format                  | Indicators                            | Approach                             |
| ----------------------- | ------------------------------------- | ------------------------------------ |
| **Feature description** | Narrative prose, informal             | Use AskUserQuestion (2-3 questions)  |
| **PRD markdown**        | Structured with headers, user stories | Skip to Phase 3 (validation)         |
| **Requirements dump**   | Lists of features, no structure       | Use AskUserQuestion (2-3 questions)  |
| **Rough notes**         | Incomplete, mixed thoughts            | Use AskUserQuestion + prioritization |

### Clarification Questions

**MANDATORY - LOAD REFERENCE**: For question templates, read [`references/question-templates.md`](references/question-templates.md).

**Do NOT Load** for existing PRDs with clear user stories.

Questions should uncover story-sizing implications:

- "How large is the feature?" → affects story count
- "What's the minimum viable scope?" → prevents over-scoping
- "Are there dependencies?" → affects ordering

---

## Phase 2: Structure as Stories

### Story Formula

```text
US-XXX: [Title]
Description: As a [user], I want [feature] so that [benefit]
Acceptance Criteria:
  - [ ] Specific verifiable criterion
  - [ ] Another criterion
  - [ ] Typecheck passes
```

### Story Count by Scope

| Scope                       | Story Count       | Example                       |
| --------------------------- | ----------------- | ----------------------------- |
| Small (10-20 lines input)   | 2-4 stories       | Add status field + display    |
| Medium (50-100 lines input) | 4-8 stories       | Feature set with backend + UI |
| Large (200+ lines input)    | Split into phases | Major system, phased rollout  |

### PRD Structure (Ralph-Specific)

Use standard PRD sections. Ralph-specific requirements:

- **User Stories**: MUST follow story-sizing rules below
- **Acceptance Criteria**: MUST include "Typecheck passes" + browser verification for UI
- **Order**: MUST respect dependency ordering (schema → backend → UI)
- **Non-Goals**: MUST define scope boundaries to prevent story bloat

---

## Phase 3: Validate Story Sizing (CRITICAL)

### Right-Sized Stories

| Scope    | Example                                  | Context Fit |
| -------- | ---------------------------------------- | ----------- |
| ✅ Small | "Add status column to table + migration" | 1 iteration |
| ✅ Small | "Add UI component to existing page"      | 1 iteration |
| ✅ Small | "Update server action with new logic"    | 1 iteration |
| ✅ Small | "Add filter dropdown to list"            | 1 iteration |

### Too-Big Stories (Must Split)

| Scope                                                           | Issue           | Split Into                                       |
| --------------------------------------------------------------- | --------------- | ------------------------------------------------ |
| ❌ "Build entire dashboard"                                     | Multiple layers | schema → queries → UI → filters                  |
| ❌ "Add authentication system"                                  | Too complex     | schema → middleware → login UI → session         |
| ❌ "Implement custom sessions with templates, sharing, history" | Feature creep   | schema → basic UI → features → history → sharing |
| ❌ "Refactor entire API"                                        | Too broad       | One story per endpoint pattern                   |

### Rule of Thumb

**If you cannot describe a story in 2-3 sentences, it is too big.**

### Red Flags (Auto-Detect)

```text
OVER-SIZED STORY INDICATORS:

- Title is compound: "AND", "PLUS", "WITH"
  Example: "Add status field AND display badge AND filter"
  → Split into 3 stories

- Description has multiple "and also":
  "Add schema, and also implement UI, and also add API"
  → Split into 3-4 stories

- 6+ acceptance criteria
  → Probably too big, verify by criteria count

- Crosses multiple layers:
  "Add database + API + UI + tests all in one"
  → Separate stories per layer
```

### Dependency Ordering

**Correct order**:

1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Dashboard/summary views that aggregate data

**Wrong order**:

```text
❌ US-001: Add UI component (depends on schema that doesn't exist yet)
❌ US-002: Create database schema
```

**Correct order**:

```text
✅ US-001: Create database schema
✅ US-002: Add UI component
```

---

## Phase 4: Convert to prd.json

**MANDATORY - LOAD REFERENCE**: For exact schema and examples, read [`references/json-schema.md`](references/json-schema.md).

### Quick Reference

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name-kebab-case]",
  "description": "[Feature description from PRD intro]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Typecheck passes"],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Conversion Rules

1. Each user story → one JSON entry (in order)
2. IDs: Sequential (US-001, US-002, etc.)
3. Priority: Based on dependency order (first story = priority 1)
4. All stories: `passes: false`, `notes: ""`
5. branchName: Kebab-case, prefixed with `ralph/`

### Required Criteria

| Story Type     | Add These Criteria                          |
| -------------- | ------------------------------------------- |
| ALL stories    | "Typecheck passes"                          |
| UI changes     | "Verify in browser using dev-browser skill" |
| Logic/behavior | "Tests pass" (if applicable)                |

---

## NEVER Do (Anti-Patterns)

| Anti-Pattern                                 | WHY It Fails                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| ❌ Stories that take 2+ context windows      | Ralph runs out of context mid-implementation → broken code, wasted iteration |
| ❌ Mix database schema with UI in same story | Different phases, different concerns → context overload, coupling errors     |
| ❌ Story depends on a later story            | Ralph executes in order → build failure, missing dependencies                |
| ❌ "Handle all edge cases" as criterion      | Too vague → Ralph interprets liberally, scope explodes, never finishes       |
| ❌ Ask if user "understands" or "agrees"     | Not verifiable → acceptance criteria must be objective, testable             |
| ❌ Stories with 6+ acceptance criteria       | Usually indicates scope creep → split into smaller, focused stories          |
| ❌ Skip AskUserQuestion when ambiguous       | Wrong assumptions → wrong stories → wasted iterations, rework                |
| ❌ Assume "obvious" stories                  | Implicit requirements → Ralph misses them → incomplete feature, gaps         |
| ❌ Output prd.json without validating sizes  | Oversized stories slip through → Ralph fails mid-story, corrupted state      |

---

## Error Recovery

| Situation                                   | Response                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| User refuses to answer clarifying questions | Make reasonable assumptions, document in "Open Questions" section of PRD       |
| Requirements are contradictory              | Call out contradiction explicitly, ask for resolution before proceeding        |
| Feature too large for single prd.json       | Propose phase split (Phase 1/Phase 2 prd.json files), get approval first       |
| User insists on oversized stories           | Warn about Ralph failure risk, comply but add warning in story's `notes` field |
| Existing PRD has poorly-sized stories       | Flag specific issues, propose splits, get approval before conversion           |
| Unclear which layer a story belongs to      | Default to most restrictive (schema first), note assumption in story           |

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

---

## Checklist Before Output

- [ ] Input classified, AskUserQuestion used if needed
- [ ] Each story describable in 2-3 sentences (not too big)
- [ ] Stories ordered by dependency (no forward dependencies)
- [ ] Every story has "Typecheck passes"
- [ ] UI stories have "Verify in browser using dev-browser skill"
- [ ] No story exceeds 6 acceptance criteria
- [ ] All titles are action-oriented and specific
- [ ] Acceptance criteria are verifiable, not vague
- [ ] prd.json format matches schema exactly
- [ ] branchName is kebab-case, prefixed with `ralph/`

---

## Complete Example

**OPTIONAL - LOAD REFERENCE**: For full end-to-end walkthrough, read [`references/complete-example.md`](references/complete-example.md).

**Do NOT Load** if you're experienced with this workflow or working with simple conversions.

---

## File Locations

- **prd.json** (required): `ralph/tasks/prd.json`
- **PRD markdown** (optional): `ralph/tasks/prd-[feature-name].md`

---

## Related Documentation

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - System design
- [git-workflow.md](../../rules/git-workflow.md) - Tracer bullets methodology
