// Validates the session cookie and attaches identity to req.
// Returns 401 if no valid session.
// Returns 403 if mustChangePassword=true and route is not /auth/change-password.

import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { auth, type SessionUser } from "../lib/auth";

// Extend Express Request with the authenticated user
declare global {
  namespace Express {
    interface Request {
      identity?: SessionUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });
  if (!session) {
    return next(new AppError(401, "Unauthorized"));
  }
  if (session.user.mustChangePassword && req.path !== "/auth/change-password") {
    return next(new AppError(403, "PASSWORD_CHANGE_REQUIRED"));
  }
  req.identity = session.user;
  next();
}
