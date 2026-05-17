"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { resendVerification } from "@/lib/auth";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

function isUnverifiedEmailError(message: string) {
  const msg = message.toLowerCase();
  return (
    msg.includes("not verified") ||
    msg.includes("verify your email") ||
    msg.includes("account is inactive") ||
    msg.includes("inactive")
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const justVerified = params.get("verified") === "true";
  const nextParam = params.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      await login({ email, password });
      router.push(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      if (isUnverifiedEmailError(message)) {
        setUnverifiedEmail(email);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await resendVerification(unverifiedEmail);
    } catch {
      // non-blocking — the user can still resend from the verify-email page
    } finally {
      setResending(false);
      router.push(`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">ElementPay</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
        Sign in to your business dashboard
      </p>

      {justVerified && !error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 bg-tertiary-100 dark:bg-tertiary-900/30 border border-tertiary-200 dark:border-tertiary-800 text-tertiary-700 dark:text-tertiary-200 text-sm px-4 py-3 rounded-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Email verified. Sign in to continue.
        </motion.div>
      )}

      {unverifiedEmail && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs px-3 py-2 rounded-lg"
        >
          <MailWarning className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 leading-tight">
            Account inactive. Verify <span className="font-medium">{unverifiedEmail}</span> to continue.
          </span>
          <button
            type="button"
            onClick={handleVerifyEmail}
            disabled={resending}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold text-xs px-2.5 py-1 transition-colors shrink-0"
          >
            {resending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                Verify
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none"
        >
          {loading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          or
        </span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="mt-6">
        <SocialAuthButtons />
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          Create account
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
