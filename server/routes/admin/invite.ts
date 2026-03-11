// POST /api/admin/invite — director invites a new user with a temp password.
// better-auth is bypassed here; we hash the password with argon2 and insert directly.

import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";

export const inviteRouter = Router();

inviteRouter.post(
  "/invite",
  requireAuth,
  requireRole("director"),
  async (_req, res) => {
    // TODO: implement invite flow (validate body, hash temp password, insert user)
    res.status(501).json({ error: "Not implemented" });
  },
);
