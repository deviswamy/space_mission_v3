# Quick Start: Merged /prd Skill

**Status**: ✅ Fully Implemented
**Compatibility**: ✅ 100% backward compatible with ralph.sh
**Input Formats**: Feature description, PRD markdown, notes, requirements

---

## Usage Examples

### Example 1: Feature Description → prd.json

```text
User: "Create prd.json for a custom sessions feature"
```

**What happens**:

1. Agent detects: Feature description (informal, needs clarification)
2. Asks: 3-5 clarifying questions
3. Structures: As user stories with validation
4. Validates: Story sizes (< 2 context windows each)
5. Outputs: `ralph/tasks/prd.json` ready for ralph.sh

**Time**: ~5-10 minutes

---

### Example 2: Existing PRD Markdown → prd.json

```text
User: Pastes existing PRD markdown
```

**What happens**:

1. Agent detects: PRD markdown (structured, has stories)
2. Skips: Clarifying questions
3. Validates: Story sizes and dependencies
4. Suggests: Splits for over-scoped stories
5. Outputs: `ralph/tasks/prd.json`

**Time**: ~2-3 minutes

---

### Example 3: Rough Notes → prd.json

```text
User: Pastes bullet points and rough requirements
```

**What happens**:

1. Agent detects: Requirements dump (unstructured)
2. Asks: 2-3 prioritization questions
3. Structures: As user stories
4. Validates: Story sizes
5. Outputs: `ralph/tasks/prd.json`

**Time**: ~5 minutes

---

## Input Detection

The skill automatically detects input format:

| Input | Indicators | Next Step |
| ------- | ----------- | ----------- |
| Feature description | Narrative prose, informal, asks questions | Ask clarifying questions |
| PRD markdown | Headers, structured user stories, acceptance criteria | Skip to validation |
| Requirements dump | Bullet lists, feature requirements | Ask prioritization questions |
| Rough notes | Mixed thoughts, incomplete, informal | Ask clarifying questions + prioritization |

---

## The 4-Phase Workflow

### Phase 1: Input Detection & Clarification

- Auto-detect format
- Ask 3-5 clarifying questions (if needed)
- Understand scope, goals, dependencies

### Phase 2: Structure as Stories

- Convert requirements to user stories
- Each story: ID, Title, Description, Acceptance Criteria
- Format: Markdown for review before Phase 4

### Phase 3: Validate Story Sizing (NEW!)

- Check each story is completable in 1 context window
- Flag red flags: compounds (AND), 6+ criteria, crossed layers
- Suggest splits for over-scoped stories
- Verify dependency ordering

### Phase 4: Convert to prd.json

- Transform validated stories to JSON
- Ensure "Typecheck passes" in all criteria
- Add "Verify in browser using dev-browser skill" for UI stories
- Output: `ralph/tasks/prd.json`

---

## When to Use /prd

### ✅ Do Use

- Planning a new feature from scratch
- Converting existing PRDs to executable format
- Transforming requirements into story-based specs
- Getting feedback before implementation
- Ensuring stories fit in single context windows

### ❌ Don't Use

- For documentation only (use /prd for JSON output instead)
- When you have 0 requirements (ask team first)
- For refactoring without clear scope

---

## What You Get

✅ **Structured PRD** with:

- Introduction & Goals
- User Stories with IDs
- Functional Requirements
- Non-Goals
- Design & Technical Considerations
- Success Metrics

✅ **Validated Stories** that:

- Fit in single context windows
- Have clear acceptance criteria
- Are properly ordered by dependencies
- Don't have circular dependencies
- Have actionable, verifiable criteria

✅ **prd.json** that:

- Is ready for `ralph.sh` execution
- Has all required fields
- Follows exact schema
- Is 100% compatible with Ralph

---

## Red Flags Detected

The skill's Phase 3 automatically flags over-scoped stories:

```text
❌ Compound titles: "Add field AND display badge AND filter"
   → Split into 3 separate stories

❌ Too many criteria: 6+ acceptance criteria
   → Usually indicates story is too big

❌ Multiple layers: "Add DB + API + UI + tests all in one"
   → Split by layer (one story per layer)

❌ "and also" descriptions
   → Sign of scope creep, needs splitting
```

---

## File Locations

**Generated files**:

- `ralph/tasks/prd.json` (required for ralph.sh)
- `ralph/tasks/prd-[feature-name].md` (optional, for reference)

---

## Compatible With

- ✅ `ralph.sh` — No script changes needed
- ✅ Existing `prd.json` files — Format unchanged
- ✅ Ralph autonomous agent — Same JSON schema
- ✅ Previous /prd usage — Same input still works
- ✅ Previous /ralph usage — Same conversion logic

---

## Key Improvements

| vs. Old Workflow | New Benefit |
| ---------------- | ------------ |
| Two invocations → One | 50% faster workflow |
| Intermediate markdown step removed | Direct to prd.json |
| Story validation post-hoc → Pre-emptive | Catches issues early |
| No input flexibility → Auto-detects format | Works with any input |
| Separated concerns → Integrated workflow | Single coherent process |

---

## Example Output

```json
{
  "project": "KinkTech",
  "branchName": "ralph/custom-sessions",
  "description": "Allow users to create and save custom session blueprints with their preferred tasks and intensity levels.",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add custom session schema",
      "description": "As a developer, I need to store custom session blueprints in the database.",
      "acceptanceCriteria": [
        "Add customSessions table with fields: id, userId, title, taskIds, createdAt",
        "Create migration",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display custom sessions in UI",
      "description": "As a user, I want to see my saved custom sessions when building a new session.",
      "acceptanceCriteria": [
        "Add 'My Sessions' tab to SessionBuilder",
        "List custom sessions with edit/delete buttons",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

---

## Next Steps

1. Run: `/prd [your feature description or PRD]`
2. Answer: Clarifying questions (if asked)
3. Review: Generated prd.json
4. Execute: `bash ralph/ralph.sh` to start building

---

## Need Help?

See full documentation: `/prd` skill SKILL.md

For backward compatibility details: `COMPATIBILITY_VERIFICATION.md`

For merge details: `MERGE_SUMMARY.md`
