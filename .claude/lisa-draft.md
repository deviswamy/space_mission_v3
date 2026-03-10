# Lisa Draft — Mission Control

**Status:** Complete — PRD generated
**Output:** `lisa/tasks/mission-control.md` + `lisa/tasks/mission-control.json`

## Key decisions
- Stack: React + Node/Express + PostgreSQL
- Auth: Session-based, director sets temp password for invites
- Orgs: 2 seeded orgs (Orion, Apollo), one org per user
- Crew profile: skills (tags), availability (date ranges), experience level
- Auto-matching: skill + experience weighted, auto-triggered on submit
- Notifications: in-app only
- 6 features, 17 stories, 12 UI pages
