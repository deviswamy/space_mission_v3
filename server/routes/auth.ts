// Auth routes — delegates to better-auth handler.
// better-auth handles /sign-in, /sign-out, /get-session internally.
// Custom POST /change-password is defined first (bypasses mustChangePassword guard).

import { hash } from "@node-rs/argon2";
import { toNodeHandler } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { accounts, users } from "../../shared/schema/auth";
import { ChangePasswordSchema } from "../../shared/contracts";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { AppError } from "../lib/errors";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

// Custom forced change-password — accessible even when mustChangePassword=true
authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  const result = ChangePasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, "Invalid request"));
  }
  const { newPassword } = result.data;
  const userId = req.identity!.id;

  const passwordHash = await hash(newPassword);

  await db
    .update(accounts)
    .set({ password: passwordHash })
    .where(eq(accounts.userId, userId));

  await db
    .update(users)
    .set({ mustChangePassword: false })
    .where(eq(users.id, userId));

  res.json({ success: true });
});

// Delegate all other /api/auth/* to better-auth
authRouter.all("/*splat", toNodeHandler(auth));
