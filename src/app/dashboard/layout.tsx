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
    <div className="min-h-screen bg-[#F7F8FC] text-[#171D32]">
      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
          <DashboardNavbar />
        </div>
      </div>

      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
          <DashboardTabs />
        </div>
      </div>

      <main className="mx-auto max-w-[1480px] px-5 pb-10 pt-6 md:px-7 lg:px-10">{children}</main>

      <DevStatusBar />
    </div>
  );
}
