// bun server/db/migrate.ts — runs all pending Drizzle migrations.

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../lib/db";

await migrate(db, { migrationsFolder: "./server/db/migrations" });

console.log("Migrations complete");
process.exit(0);
