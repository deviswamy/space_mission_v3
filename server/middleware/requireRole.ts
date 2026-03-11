// Role guard factory — wrap a route with requireRole("director") to restrict access.
// Must be used after requireAuth (relies on req.identity being set).

import type { NextFunction, Request, Response } from "express";
import type { User } from "../../shared/schema/auth";
import { AppError } from "../lib/errors";

type Role = NonNullable<User["role"]>;

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.identity?.role as Role | undefined;
    if (!role || !roles.includes(role)) {
      next(new AppError(403, "Forbidden"));
      return;
    }
    next();
  };
}
