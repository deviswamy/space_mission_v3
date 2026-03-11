// better-auth instance — imported by routes/auth.ts and middleware/requireAuth.ts

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../../shared/schema/index";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      orgId: {
        type: "string",
        required: true,
        fieldName: "org_id",
      },
      role: {
        type: "string",
        required: true,
      },
      mustChangePassword: {
        type: "boolean",
        required: true,
        defaultValue: true,
        fieldName: "must_change_password",
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});

export type Auth = typeof auth;
/** Type-safe session user inferred from better-auth config. Includes orgId, role, mustChangePassword. */
export type SessionUser = typeof auth.$Infer.Session.user;
