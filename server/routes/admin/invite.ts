// POST /api/admin/invite — director invites a new user with a temp password.
// better-auth is bypassed here; we hash the password with argon2 and insert directly.

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { accounts, users } from "../../../shared/schema/auth";
import { InviteUserSchema } from "../../../shared/contracts";
import { db } from "../../lib/db";
import { AppError } from "../../lib/errors";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";

export const inviteRouter = Router();

inviteRouter.post(
  "/invite",
  requireAuth,
  requireRole("director"),
  async (req, res, next) => {
    const result = InviteUserSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, "Invalid request"));

    const { email, name, role, temporaryPassword } = result.data;
    const orgId = req.identity!.orgId;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) return next(new AppError(400, "Email already in use"));

    const passwordHash = await hash(temporaryPassword);
    const userId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        emailVerified: true,
        orgId,
        role,
        mustChangePassword: true,
      });
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: email,
        providerId: "credential",
        userId,
        password: passwordHash,
      });
    });

    res.status(201).json({ success: true });
  },
);
