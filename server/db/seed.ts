/**
 * @fileoverview Seed script — inserts 2 orgs (Orion, Apollo), one director each, and 5 skills per org.
 * Idempotent: clears all seeded tables before re-inserting.
 * Run: bun server/db/seed.ts (or `bun db:seed` from root)
 */

import { hash } from "@node-rs/argon2";
import { db } from "../lib/db";
import { orgs, skills } from "../../shared/schema/orgs";
import { accounts, sessions, users } from "../../shared/schema/auth";

const SKILL_NAMES = [
  "EVA Operations",
  "Navigation",
  "Medical",
  "Engineering",
  "Communications",
];

const SEED_DATA = [
  {
    org: { name: "Orion Space Agency", slug: "orion" },
    director: {
      email: "director@orion.space",
      name: "Orion Director",
      password: "Director@Orion1",
    },
  },
  {
    org: { name: "Apollo Collective", slug: "apollo" },
    director: {
      email: "director@apollo.space",
      name: "Apollo Director",
      password: "Director@Apollo1",
    },
  },
];

await db.transaction(async (tx) => {
  // Clear in FK-safe order
  await tx.delete(accounts);
  await tx.delete(sessions);
  await tx.delete(skills);
  await tx.delete(users);
  await tx.delete(orgs);

  for (const { org, director } of SEED_DATA) {
    // Insert org
    const orgId = crypto.randomUUID();
    await tx.insert(orgs).values({
      id: orgId,
      name: org.name,
      slug: org.slug,
    });

    // Insert director user
    const userId = crypto.randomUUID();
    await tx.insert(users).values({
      id: userId,
      email: director.email,
      name: director.name,
      emailVerified: true,
      orgId,
      role: "director",
      mustChangePassword: false,
    });

    // Insert credential account (better-auth credential provider)
    const passwordHash = await hash(director.password);
    await tx.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: director.email,
      providerId: "credential",
      userId,
      password: passwordHash,
    });

    // Insert 5 skills per org
    await tx.insert(skills).values(
      SKILL_NAMES.map((name) => ({
        id: crypto.randomUUID(),
        orgId,
        name,
      })),
    );

    console.log(`Seeded: ${org.name} — ${director.email}`);
  }
});

console.log("Seed complete: 2 orgs, 2 directors, 10 skills");
process.exit(0);
