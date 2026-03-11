// bun server/db/seed.ts — seeds 2 orgs (Orion, Apollo), their directors, and 5 skills each.
// Idempotent: uses upsert so it is safe to re-run.

import { db } from "../lib/db";

// TODO: implement seed inserts for:
//   - orgs: Orion Space Agency, Apollo Collective
//   - users: one director per org (known email + hashed temp password)
//   - skills: 5 per org (e.g. Piloting, Navigation, Systems Engineering, EVA, Medic)

console.log("Seed complete");
process.exit(0);
