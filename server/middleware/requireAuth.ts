// Validates the session cookie and attaches identity to req.
// Returns 401 if no valid session.
// Returns 403 if mustChangePassword=true and route is not /auth/change-password.

import type { NextFunction, Request, Response } from "express";
import type { User } from "../../shared/schema/auth";
import { AppError } from "../lib/errors";
import { auth } from "../lib/auth";

// Extend Express Request with the authenticated user
declare global {
  namespace Express {
    interface Request {
      identity?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // TODO: implement session validation via auth.api.getSession
  next(new AppError(401, "Unauthorized"));
}
