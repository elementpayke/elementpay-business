"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

const passwordRules = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";

const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allRulesPass = passwordRules.every((r) => r.test(password));
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = businessName.trim();
    if (trimmedName.length < 2) return setError("Business name is required.");
    if (!allRulesPass) return setError("Password does not meet the requirements.");
    if (!passwordsMatch) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await register({
        business_name: trimmedName,
        email: email.trim(),
        password,
      });
      router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          ElementPay
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
        Get started with your business dashboard
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="businessName" className={labelClass}>
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            autoComplete="organization"
            placeholder="Acme Inc."
            minLength={2}
            maxLength={255}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 12 characters"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-1.5"
            >
              {passwordRules.map((rule) => {
                const pass = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {pass ? (
                      <Check className="w-3.5 h-3.5 text-tertiary-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    )}
                    <span
                      className={
                        pass
                          ? "text-tertiary-600 dark:text-tertiary-400"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? "border-tertiary-300 dark:border-tertiary-700 focus:ring-tertiary-500/20 focus:border-tertiary-500"
                    : "border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 dark:border-gray-700 focus:ring-primary-500/20 focus:border-primary-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold h-12 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <>
              Create Account
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

      <p className="mt-6 text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary-500 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary-500 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
