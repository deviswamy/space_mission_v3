import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { authClient } from "../lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginInput = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: "/",
    });
    if (result.error) {
      setError("Invalid email or password");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      {/* Left panel — brand & value prop (hidden on small screens) */}
      <div className="hidden sm:flex sm:w-1/2 flex-col justify-between bg-gray-950 px-12 py-16">
        <LogoMark />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-4">
            The right crew,<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              on every mission.
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Multi-org crew management that eliminates manual cross-referencing.
            Skill matching, availability tracking, and auto-assignment — in one place.
          </p>
        </div>
        <TrustBadges />
      </div>

      {/* Right panel — sign-in form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        {/* Mobile-only logo */}
        <div className="mb-8 sm:hidden">
          <LogoMark dark={false} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Sign in to your org</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your credentials to access Mission Control.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work email
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@yourorg.space"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Signing in…" : "Sign in to Mission Control →"}
            </button>
          </form>

          {/* Mobile trust signals */}
          <div className="mt-6 sm:hidden">
            <TrustBadges dark={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoMark({ dark = true }: { dark?: boolean }) {
  const textColor = dark ? "text-white" : "text-gray-900";
  const subColor = dark ? "text-gray-400" : "text-gray-500";
  return (
    <div className="flex items-center gap-3">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="15" stroke={dark ? "#3b82f6" : "#2563eb"} strokeWidth="2" />
        <circle cx="16" cy="16" r="6" fill={dark ? "#3b82f6" : "#2563eb"} />
        <ellipse cx="16" cy="16" rx="15" ry="6" stroke={dark ? "#60a5fa" : "#3b82f6"} strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
      <div>
        <span className={`text-base font-semibold ${textColor}`}>Mission Control</span>
        <span className={`block text-xs ${subColor}`}>Crew Operations Platform</span>
      </div>
    </div>
  );
}

function TrustBadges({ dark = true }: { dark?: boolean }) {
  const color = dark ? "text-gray-500" : "text-gray-400";
  const divider = dark ? "bg-gray-700" : "bg-gray-200";
  return (
    <div className={`flex items-center gap-3 text-xs ${color}`}>
      <span>End-to-end encrypted</span>
      <span className={`h-3 w-px ${divider}`} />
      <span>Multi-org isolated</span>
      <span className={`h-3 w-px ${divider}`} />
      <span>Role-gated access</span>
    </div>
  );
}
