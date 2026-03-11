import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema/index";

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.DATABASE_URL_TEST!
    : process.env.DATABASE_URL!;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
