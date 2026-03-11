// Renders children only if the current user has one of the required roles.
// Renders null otherwise (or an optional fallback).

import type { ReactNode } from "react";
import { authClient, type SessionUser } from "../lib/auth";

type Role = SessionUser["role"];

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = authClient.useSession();
  const role = (session?.user as SessionUser | undefined)?.role;
  if (!role || !roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
