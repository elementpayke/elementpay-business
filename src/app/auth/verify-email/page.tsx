"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail, RotateCcw } from "lucide-react";
import { verifyEmail, resendVerification } from "@/lib/auth";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[idx] = value.slice(-1);
    setCode(next);
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const fullCode = code.join("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await verifyEmail(email, fullCode);
      router.push("/auth/login?verified=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    try {
      await resendVerification(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No email address provided.</p>
        <Link href="/auth/register" className="text-primary-500 font-semibold hover:underline">
          Go to registration
        </Link>
      </div>
    );
  }

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

      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <Mail className="w-7 h-7 text-primary-500" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
        Check your email
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm text-center">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
        >
          {error}
        </motion.div>
      )}

      {resent && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-tertiary-100 dark:bg-tertiary-900/30 border border-tertiary-200 dark:border-tertiary-800 text-tertiary-700 dark:text-tertiary-200 text-sm px-4 py-3 rounded-xl"
        >
          Verification code resent successfully.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        {/* OTP Input */}
        <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 text-center text-lg font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || fullCode.length !== 6}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <>
              Verify Email
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Wrong email?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          Go back
        </Link>
      </p>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
