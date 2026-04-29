"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated, logout } = useAuth();
  const { ready, tier1Complete, tier1PendingPhone } = useOnboarding();

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace("/auth/login");
      return;
    }
    if (!ready) return;
    // Already done — bounce to dashboard.
    if (tier1Complete || tier1PendingPhone) {
      router.replace("/dashboard");
    }
  }, [loading, authenticated, ready, tier1Complete, tier1PendingPhone, router]);

  const gated = loading || !authenticated || !ready || tier1Complete || tier1PendingPhone;

  if (gated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              ElementPay
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/auth/login");
              }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">{children}</main>
    </div>
  );
}
