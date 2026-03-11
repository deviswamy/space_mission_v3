// Renders children only if the current user has one of the required roles.
// Renders null otherwise (or an optional fallback).

import type { ReactNode } from "react";
import type { User } from "../../../shared/schema/auth";

type Role = NonNullable<User["role"]>;

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ children, fallback = null }: RoleGuardProps) {
  // TODO: implement role check via authClient.useSession()
  return <>{children ?? fallback}</>;
}
