"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import DevStatusBar from "@/components/dashboard/DevStatusBar";
import { useAuth } from "@/lib/AuthContext";
import { devLog } from "@/lib/devlog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated } = useAuth();
  const lastAuthRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (lastAuthRef.current === null) {
      devLog.info("auth", authenticated ? "Session restored" : "No active session");
    } else if (lastAuthRef.current !== authenticated) {
      devLog.info("auth", authenticated ? "Signed in" : "Signed out");
    }
    lastAuthRef.current = authenticated;

    if (!authenticated) {
      router.replace("/auth/login");
    }
  }, [authenticated, loading, router]);

  if (loading || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FC] text-[#171D32]">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <DevStatusBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FC] text-[#171D32]">
      {/* Navbar */}
      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 md:px-7 lg:px-10">
          <DashboardNavbar />
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 md:px-7 lg:px-10">
          <DashboardTabs />
        </div>
      </div>

      {/* Page content — extra bottom padding on mobile so buttons clear thumb reach */}
      <main className="mx-auto w-full max-w-[1480px] overflow-x-hidden px-4 pb-24 pt-6 sm:px-5 sm:pb-16 md:px-7 lg:px-10 lg:pb-10">
        {children}
      </main>

      <DevStatusBar />
    </div>
  );
}
