# Auto-Matching Engine: Algorithm Research Report

**Mission Control — Crew-to-Mission Assignment**
Date: 2026-03-10

---

## Executive Summary

- A **multi-criteria weighted scoring system** is the best fit for this project: pure function, O(n·m) time complexity, fully transparent, and easy to tune per org.
- Crew must pass two **hard-constraint filters** before scoring: (1) availability overlap with the mission date range, and (2) possession of all required skills.
- **Proficiency gaps should penalise; surplus should reward** — a linear gap model gives the most predictable scoring behaviour.
- A **space-specific skill taxonomy** of ~40 skills across 9 categories aligns with NASA/ESA training programmes and supports the matcher's scoring logic.
- The **Hungarian algorithm** provides a globally optimal team assignment but is O(n³) and harder to reason about; recommended only as a future upgrade for large orgs (>150 crew).
- **Constraint Satisfaction (CSP)** is powerful for multi-role team composition requirements but adds significant complexity; defer unless mission requirements mandate hard role coverage rules.

---

## Research Question and Scope

**Primary question:** What algorithm(s) best support scoring and ranking crew members for mission assignment in a space mission management SaaS, given the constraints of a pure TypeScript function with no database calls?

**Scope:**

- Algorithms: weighted scoring, Hungarian assignment, greedy constraint filtering, CSP
- Modelling: date-range availability, skill proficiency gaps, workload
- Skill taxonomy: space-domain skills aligned with matching criteria
- Excluded: ML/AI approaches, real-time streaming, multi-agent systems

---

## Methodology

- Web searches across academic papers (arXiv, IEEE Xplore, ScienceDirect), NASA/ESA documentation, and engineering references
- Cross-referenced with project constraints: pure function, Bun/TypeScript, orgs of 10–200 crew
- Sources rated by domain relevance and publication authority

---

## Key Findings

1. **Interval overlap** is the standard O(1) per-crew check for availability: `crewStart <= missionStart && crewEnd >= missionEnd` (full coverage) or the looser overlap form. [IEEE Xplore — Interval Matching Algorithm]
2. **Weighted scoring** reduces multi-criteria matching to a single comparable number; weights should be configurable per org. [Savio, Daily.dev, GeeksforGeeks]
3. **The Hungarian algorithm** finds the globally optimal assignment in O(n³); applied to airline crew scheduling with proven cost reductions. [IJRASET — Optimal Assignment of Cabin Crew in Airlines]
4. **Proficiency gap = Required − Current**; a positive gap is a disqualifier or heavy penalty; negative (surplus) is a bonus. [ResearchGate — Identifying and Quantifying Personnel Skill Gaps]
5. **NASA training** covers five broad competency domains: flight operations, EVA, robotics, science, and systems engineering — all mappable to a skills table. [NASA Astronaut Selection & Training]
6. **Workload penalty** (active assignments) prevents over-concentration on top performers; piecewise linear penalty functions give better fairness than a flat multiplier. [MDPI — Balancing Workload Fairness]
7. **CSP with backtracking** can enforce hard role-coverage rules (e.g., "team must include ≥1 medical officer") but is NP-hard for large domains. [AIMA, Berkeley]
8. **Greedy Earliest-Finish-Time** is optimal for single-resource interval scheduling; the multi-crew generalisation (select top-N after filtering) is practically optimal for orgs under 200 crew. [University of Toronto — Greedy Algorithms]

---

## Analysis

### Section 1: Availability Modelling

**Mission date range** = `[missionStart, missionEnd]`
**Crew availability** = array of `[availStart, availEnd]` windows (crew may have multiple gaps or rotations)

**Full coverage check** (recommended — crew must be free for the entire mission):

```text
isAvailable = windows.some(w => w.start <= mission.start && w.end >= mission.end)
```

**Partial overlap check** (softer — crew is available for some portion):

```text
overlaps = w.start < mission.end && w.end > mission.start
coverageRatio = overlapDays / missionDuration  // 0.0–1.0
```

**Recommendation:** Treat full coverage as a **hard filter** (exclude partial). Partial coverage can be expressed as a score bonus if the org wants to allow it as a configurable option.

---

### Section 2: Proficiency Gap Modelling

**Gap formula per skill:**

```text
gap = mission.requiredProficiency - crew.proficiency   // 1–5 scale
```

| Gap | Meaning | Scoring treatment |
| ----- | --------- | ------------------- |
| gap > 2 | Significant under-qualification | Hard disqualify |
| gap = 1–2 | Minor under-qualification | Heavy penalty (-20 per point) |
| gap = 0 | Exact match | No bonus/penalty |
| gap < 0 | Surplus proficiency | Bonus (+10 per point, capped at +30) |

**Multi-skill aggregation:** Sum gap scores across all mission-required skills. A crew member who matches 4 of 5 required skills should score higher than one who matches 2 of 5.

---

### Section 3: Three Algorithm Options

#### Algorithm A — Enhanced Weighted Scoring (Recommended)

A pure scoring function. Crew members are scored independently against the mission, then sorted; top N are selected.

**Pipeline:**

1. **Filter: Availability** — remove crew who are unavailable for the mission window
2. **Filter: Required skills** — optionally remove crew missing more than K required skills (configurable hard cut-off)
3. **Score each crew member:**

```text
score = 0

for each requiredSkill in mission.requirements:
  crewSkill = crew.skills.find(s => s.id === requiredSkill.id)

  if crewSkill is undefined:
    score -= 50                                    // missing skill penalty
  else:
    gap = requiredSkill.proficiency - crewSkill.proficiency
    if gap > 2:
      score -= 40                                  // major gap penalty
    else if gap > 0:
      score -= gap * 20                            // minor gap penalty
    else:
      score += 100                                 // skill match base
      score += Math.min(Math.abs(gap), 3) * 10    // surplus bonus (capped)

score -= crew.activeAssignments * 5               // workload penalty
```

**Complexity:** O(n · m) where n = crew size, m = number of required skills

**Pros:**

- Directly fits the existing formula pattern in the codebase
- Pure function, no external state
- Fully unit-testable with deterministic outputs
- Weights can be tuned per org without changing algorithm structure
- Easy to explain to users ("crew member scored 245 — matched 3/4 skills, minor gap on EVA")

**Cons:**

- Does not guarantee globally optimal team (could pick two overlapping specialists and miss a generalist)
- No role-coverage guarantee (e.g., does not ensure ≥1 medical officer in final team)

---

#### Algorithm B — Hungarian Algorithm (Optimal Global Assignment)

Models crew assignment as a bipartite matching problem: one side = crew members, other side = mission slots (N slots). Edge weights = individual scores from Algorithm A.

**Finds the globally optimal assignment** — maximises the total team score rather than selecting individual top scorers.

**Complexity:** O(n³) — for 200 crew and 10 slots, roughly 8 million operations. Fast enough in practice.

**Example scenario where it differs from Algorithm A:**

- Crew member X scores 300 (best individual)
- Crew member Y scores 280 (second best)
- Both specialise in the same skill
- Hungarian picks X (300) + crew member Z (220, different specialisation) = 520 total
- Greedy would pick X (300) + Y (280) = 580 — but both cover the same role, leaving a gap

**Pros:**

- Mathematically optimal team composition
- Naturally avoids redundant skill coverage

**Cons:**

- Requires building an n×n cost matrix — more setup code
- Does not natively enforce role-type constraints
- Harder to explain the assignment decision to end users
- Overkill for small orgs (<50 crew)

**When to use:** Future upgrade when org size exceeds ~150 crew and mission slot count is high (>8 slots).

---

#### Algorithm C — Constraint Satisfaction Problem (CSP)

Models the assignment as a CSP where variables = mission slots, domains = eligible crew, constraints = skill coverage, availability, role types, and workload limits.

**Solved via backtracking with constraint propagation (arc consistency).**

**Pros:**

- Can enforce hard role requirements: "slot 1 must be filled by a crew member with Medical ≥ 3"
- Can enforce team-level constraints: "no two crew from same department", "minimum seniority level"
- Finds *any* valid assignment (not necessarily optimal)

**Cons:**

- NP-hard in the general case; exponential worst-case
- Complex to implement as a pure function in TypeScript
- Slow for large domains without heavy pruning heuristics
- No built-in ranking (finds feasibility, not optimality)

**When to use:** Add as a post-filter layer on top of Algorithm A if the org defines mandatory role-coverage rules in mission requirements.

---

### Section 4: Recommended Algorithm — Enhanced Weighted Scoring

For the MVP with orgs of 10–200 crew and the pure-function constraint:

**Use Algorithm A (Enhanced Weighted Scoring) with a three-stage pipeline:**

```text
Stage 1 — Hard filters (O(n)):
  - availabilityFilter(crew, mission)    → removes unavailable crew
  - skillPresenceFilter(crew, mission)   → removes crew missing critical skills

Stage 2 — Scoring (O(n·m)):
  - scoreCrewMember(crew, mission)       → numeric score per crew member

Stage 3 — Selection (O(n log n)):
  - sort by score descending
  - return top mission.crewCount
```

This matches the existing codebase pattern (`server/services/matcher.ts`) and is fully unit-testable without a database.

---

## Crew Skill Taxonomy

Recommended skill set for the `skills` table, grouped into 9 categories. Each skill has an ID, name, category, and a proficiency scale of 1–5.

### Proficiency Scale

| Level | Label | Description |
| ------- | ------- | ------------- |
| 1 | Novice | Basic awareness, supervised only |
| 2 | Beginner | Limited independent capability |
| 3 | Intermediate | Independent operation in standard conditions |
| 4 | Advanced | Handles complex situations, can mentor others |
| 5 | Expert | Mission-critical authority, leads training |

---

### Skill Taxonomy Table

| ID | Skill Name | Category | Notes |
| ---- | ----------- | -------- | ------- |
| `eva-basic` | EVA / Spacewalk Operations | Extravehicular Activity | Required for all deep-space missions |
| `eva-suit-maintenance` | Suit Maintenance & Repair | Extravehicular Activity | |
| `eva-tools` | EVA Tool Operation | Extravehicular Activity | Torque tools, tethers, jetpack |
| `spacecraft-piloting` | Spacecraft Piloting | Flight Operations | Jet aircraft ≥1000 hrs or simulator equiv. |
| `orbital-mechanics` | Orbital Mechanics | Flight Operations | Trajectory planning, delta-V calculations |
| `rendezvous-docking` | Rendezvous & Docking | Flight Operations | |
| `reentry-procedures` | Re-entry & Landing | Flight Operations | |
| `navigation` | Deep Space Navigation | Flight Operations | Star tracker, inertial nav |
| `robotic-arm` | Robotic Arm Operation | Robotics & Automation | Canadarm, ERA, etc. |
| `drone-ops` | Drone / UAV Operations | Robotics & Automation | Surface or orbital drones |
| `autonomous-systems` | Autonomous Systems Oversight | Robotics & Automation | |
| `eclss` | ECLSS Maintenance | Life Support Systems | O₂, CO₂, water recovery |
| `thermal-control` | Thermal Control Systems | Life Support Systems | |
| `power-systems` | Power / Electrical Systems | Engineering & Maintenance | Solar arrays, batteries, distribution |
| `structural-repair` | Structural Repair | Engineering & Maintenance | Hull patching, pressure vessel integrity |
| `plumbing-hydraulics` | Fluid Systems / Plumbing | Engineering & Maintenance | |
| `propulsion` | Propulsion Systems | Engineering & Maintenance | |
| `avionics` | Avionics & Electronics | Engineering & Maintenance | |
| `flight-medicine` | Flight Medicine | Medical & Health | Space physiology, decompression sickness |
| `emergency-care` | Emergency Medical Care | Medical & Health | CPR, trauma, surgery |
| `radiation-medicine` | Radiation Medicine | Medical & Health | Dosimetry, countermeasures |
| `psychology-support` | Crew Psychology Support | Medical & Health | Mental health, conflict resolution |
| `geology-surface` | Surface Geology | Science & Research | Sample collection, stratigraphy |
| `astrobiology` | Astrobiology & Life Detection | Science & Research | |
| `physics-experiments` | Physics Experiments | Science & Research | Microgravity experiments |
| `biology-experiments` | Biology Experiments | Science & Research | |
| `earth-observation` | Earth Observation & Remote Sensing | Science & Research | |
| `astronomy` | Astronomy & Astrophysics | Science & Research | |
| `communications` | Radio & Communications | Navigation & Communications | Frequency management, antennas |
| `telemetry` | Telemetry & Data Systems | Navigation & Communications | |
| `mission-command` | Mission Command | Leadership & Operations | Commander authority |
| `crew-resource-mgmt` | Crew Resource Management | Leadership & Operations | Team coordination, decision under stress |
| `emergency-protocols` | Emergency Protocols | Leadership & Operations | Evacuation, contingency ops |
| `rover-operations` | Rover / Surface Vehicle Ops | Planetary Surface | |
| `drilling-excavation` | Drilling & Excavation | Planetary Surface | |
| `habitat-construction` | Habitat Construction & Maintenance | Planetary Surface | |
| `resource-utilisation` | In-Situ Resource Utilisation (ISRU) | Planetary Surface | Water extraction, fuel production |
| `russian-language` | Russian Language | Cross-Domain | Required for ISS / Soyuz |
| `software-systems` | Flight Software & Computing | Cross-Domain | Onboard systems, FDIR |
| `photography-documentation` | Photography & Mission Documentation | Cross-Domain | Science return, EVA documentation |

Total: 40 skills across 9 categories.

---

## Updated Score Formula (Extended)

```typescript
// Extended from: (skillMatch ? 100 : 0) + (proficiencyBonus * 10) - (activeAssignments * 5)

function scoreCrewMember(crew: CrewProfile, mission: Mission): number {
  let score = 0

  for (const req of mission.requirements) {
    const crewSkill = crew.skills.find(s => s.skillId === req.skillId)

    if (!crewSkill) {
      score -= 50  // missing skill — heavy penalty
      continue
    }

    const gap = req.proficiency - crewSkill.proficiency

    if (gap <= 0) {
      // Meets or exceeds requirement
      score += 100                               // base match bonus
      score += Math.min(Math.abs(gap), 3) * 10  // surplus bonus (capped at +30)
    } else if (gap === 1) {
      score += 50  // close match — partial credit
    } else if (gap === 2) {
      score += 10  // borderline — minor credit
    } else {
      score -= 30  // gap > 2 — significant under-qualification
    }
  }

  score -= crew.activeAssignments * 5  // workload penalty
  return score
}
```

---

## Risks and Limitations

- **Weight subjectivity:** The gap penalty values (50, 30, 10) and workload multiplier (5) are heuristic. Real-world calibration against org data is needed.
- **No role-coverage guarantee:** Algorithm A does not enforce that the final team includes mandatory roles (e.g., a medic). Add a validation layer or CSP post-filter if required.
- **Multi-window availability:** If crew members have multiple availability windows, interval logic becomes more complex. Start with a single `[availableFrom, availableTo]` per crew and extend to arrays in v2.
- **Tie-breaking:** When scores are equal, a deterministic tie-breaker (e.g., sort by `crewId` ascending) prevents non-deterministic output.
- **Partial missions:** If a mission is updated mid-lifecycle (date change), re-run the matcher — do not cache scores.

---

## Recommendations

1. **Implement Algorithm A (Enhanced Weighted Scoring)** in `server/services/matcher.ts` as the MVP engine.
2. **Use the 40-skill taxonomy** in `server/db/schema.ts` under the `skills` table, with `category` as an enum column.
3. **Add `proficiency` (1–5 integer) to `crew_skills` and `mission_requirements`** tables.
4. **Add `available_from` / `available_to`** date columns to `crew_availability` table; extend to a multi-row model (one row per availability window) for v2.
5. **Plan for the Hungarian algorithm** as a configurable upgrade when org crew size exceeds 100 and global optimality is important.
6. **Add a role-coverage validation** (post-selection check) to warn the mission lead if the selected team is missing a critical role type.

---

## Appendix A: Evidence Table

| Claim | Source |
| ------- | -------- |
| Interval overlap condition: end_1 > start_2 && start_1 < end_2 | IEEE Xplore — Interval Matching Algorithm; Wikipedia — Interval Scheduling |
| Hungarian algorithm is O(n³), applicable to crew scheduling | Wikipedia — Hungarian Algorithm; IJRASET — Optimal Assignment of Cabin Crew in Airlines |
| Gap = Required − Current; positive gap = disqualifier | ResearchGate — Identifying and Quantifying Personnel Skill Gaps |
| NASA training includes EVA, robotics, orbital mechanics, geology, medicine | NASA Astronaut Selection & Training PDF; Astronaut Training Wikipedia |
| Weighted scoring: identify criteria, assign weights, multiply × score, rank | Savio, Daily.dev, GeeksforGeeks — Weighted Scoring Model |
| Workload fairness modelled with penalised squared deviations | MDPI — Balancing Workload Fairness in Task Assignment |
| CSP solves scheduling with hard constraints via backtracking | AIMA Chapter 5; GeeksforGeeks CSP |
| Space Skills Alliance taxonomy: ~250 competencies in 5 categories | Space Skills Alliance — Towards a Space Competencies Taxonomy |

---

## Appendix B: Sources

- [Weighted Scoring Model Guide — Savio](https://www.savio.io/product-roadmap/weighted-scoring-model/)
- [Weighted Scoring Guide for Developers — Daily.dev](https://daily.dev/blog/weighted-scoring-model-guide-for-developers)
- [Hungarian Algorithm — Wikipedia](https://en.wikipedia.org/wiki/Hungarian_algorithm)
- [Hungarian Algorithm — Brilliant Math & Science Wiki](https://brilliant.org/wiki/hungarian-matching/)
- [Optimal Assignment of Cabin Crew in Airlines — IJRASET](https://www.ijraset.com/best-journal/optimal-assignment-of-cabin-crew-in-airlines)
- [Identifying and Quantifying Personnel Skill Gaps — ResearchGate](https://www.researchgate.net/publication/337418487_Identifying_and_Quantifying_Personnel_Skill_Gaps)
- [Skill-Task Matching Model — arXiv](https://arxiv.org/pdf/2306.12176)
- [Interval Matching Algorithm — IEEE Xplore](https://ieeexplore.ieee.org/document/10076624/)
- [Interval Scheduling — Wikipedia](https://en.wikipedia.org/wiki/Interval_scheduling)
- [NASA Astronaut Selection & Training](https://www.nasa.gov/wp-content/uploads/2017/05/606877main_fs-2011-11-057-jsc-astro_trng.pdf)
- [NASA Astronaut Requirements](https://www.nasa.gov/humans-in-space/astronauts/astronaut-requirements/)
- [ESA Competency Framework — SpaceCRAFT](https://craft.spaceskills.org/v2/taxonomies/ESA-K)
- [Space Competencies Taxonomy — Space Skills Alliance](https://spaceskills.org/towards-a-space-competencies-taxonomy)
- [Balancing Workload Fairness — MDPI](https://www.mdpi.com/2076-3417/16/4/1747)
- [Constraint Satisfaction Problems — GeeksforGeeks](https://www.geeksforgeeks.org/artificial-intelligence/constraint-satisfaction-problems-csp-in-artificial-intelligence/)
- [Greedy Algorithms for Scheduling — UMD](https://www.cs.umd.edu/class/spring2025/cmsc451-0101/Lects/lect05-greedy-sched.pdf)
- [Understanding Skill-Matching Algorithms — iCreatives](https://www.icreatives.com/iblog/skill-matching-algorithms/)
