import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { ChangePasswordSchema, type ChangePasswordInput } from "../../../shared/contracts";
import { apiFetch } from "../lib/api";
import { authClient } from "../lib/auth";

export function ChangePasswordPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(ChangePasswordSchema) });

  async function onSubmit(data: ChangePasswordInput) {
    setError(null);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: data.newPassword }),
      });
      await authClient.getSession();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-6">
          You must set a new password before continuing.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              {...register("newPassword")}
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
