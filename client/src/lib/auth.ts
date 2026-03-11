// better-auth React client — use authClient.signIn / signOut / useSession

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL as string,
});

// Session user type that includes additionalFields configured in server/lib/auth.ts
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null | undefined;
  orgId: string;
  role: "director" | "mission_lead" | "crew_member";
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};
