// Redirects unauthenticated users to /login.
// Redirects users with mustChangePassword=true to /change-password.

import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { authClient } from "../lib/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // TODO: implement session check via authClient.useSession()
  // Placeholder — always renders children until auth is wired up
  return <>{children}</>;
}
