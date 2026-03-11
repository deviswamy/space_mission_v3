// Integration test DB lifecycle — runs before all integration suites.
// Connects to DATABASE_URL_TEST, drops schema, re-runs migrations, seeds baseline data.

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../server/lib/db";

export async function setupTestDb() {
  // TODO: drop public schema and recreate
  // TODO: run migrations
  // TODO: seed baseline data (2 orgs, directors, skills)
  await migrate(db, { migrationsFolder: "./server/db/migrations" });
}

export async function teardownTestDb() {
  // TODO: close DB connection
}
