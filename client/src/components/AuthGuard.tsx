// Redirects unauthenticated users to /login.
// Redirects users with mustChangePassword=true to /change-password.

import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { authClient, type SessionUser } from "../lib/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();
  const [, navigate] = useLocation();
  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (!isPending && !session) navigate("/login");
    else if (!isPending && user?.mustChangePassword) navigate("/change-password");
  }, [session, isPending, user, navigate]);

  if (isPending || !session) return null;
  return <>{children}</>;
}
