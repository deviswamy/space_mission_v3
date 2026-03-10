## Overview

Mission Control is a B2B platform that helps organisations manage missions and intelligently assign crew based on skills, availability, and workload.

### The Domain

- **Organisations** are the tenants — space agencies, research labs, private companies. All data is strictly scoped to an organisation. Data must never leak across tenants.
- **Crew Members** belong to an organisation. They have skill profiles, availability, and assignment history.
- **Missions** belong to an organisation. They have requirements, timelines, and a lifecycle that includes some form of approval before going active.
- **Assignments** connect crew to missions. The platform should include an **auto-matching engine** that intelligently suggests crew for missions based on skills, availability, and constraints.

### Roles

The platform has three roles:

- **Directors** run the organisation. They manage settings, approve missions, and have broad visibility.
- **Mission Leads** plan and manage missions. They define requirements, run the matcher, and submit missions for approval. They should not be able to approve their own missions.
- **Crew Members** manage their own profiles, availability, and respond to assignments. They have limited visibility into the broader organisation.

### MVP scope

 - Multi-tenant auth with roles
 - Mission lifecycle with approval workflow
 - Crew management system with skill profiles
 - An auto-matching engine
 - Dashboard with org-level metrics
