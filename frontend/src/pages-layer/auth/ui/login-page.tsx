"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!phone.trim() || !password) {
      setError("Phone and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ phone: phone.trim(), password });
      router.push("/feed");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 backdrop-blur-md border border-white/70 shadow-xl p-6">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
            Vinyl Social
          </p>
          <h1 className="text-2xl font-semibold text-primary-blue mt-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Sign in to continue listening with friends.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg border border-terracotta/40 bg-terracotta/15 px-3 py-2 text-sm text-terracotta"
            role="alert"
          >
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-gray-900 shadow-sm outline-none ring-0 transition focus:border-primary-blue/70 focus:bg-white"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-gray-900 shadow-sm outline-none ring-0 transition focus:border-primary-blue/70 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary-blue py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          New here?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary-blue hover:text-primary-blue/80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
