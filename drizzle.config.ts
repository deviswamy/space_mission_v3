import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema/index.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
