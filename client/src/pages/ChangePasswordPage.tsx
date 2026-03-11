import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { ChangePasswordSchema } from "../../../shared/contracts";
import { useChangePassword } from "../hooks/useChangePassword";

const FormSchema = ChangePasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormInput = z.infer<typeof FormSchema>;

export function ChangePasswordPage() {
  const [, navigate] = useLocation();
  const { changePassword, error, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(FormSchema) });

  async function onSubmit(data: FormInput) {
    try {
      await changePassword(data.newPassword);
      navigate("/");
    } catch {
      // error state is set by the hook
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
