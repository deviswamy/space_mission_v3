import { useState } from "react";
import { apiFetch } from "../lib/api";

interface UseChangePasswordResult {
  changePassword: (newPassword: string) => Promise<void>;
  error: string | null;
  isPending: boolean;
}

export function useChangePassword(): UseChangePasswordResult {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function changePassword(newPassword: string): Promise<void> {
    setError(null);
    setIsPending(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      throw err;
    } finally {
      setIsPending(false);
    }
  }

  return { changePassword, error, isPending };
}
