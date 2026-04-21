"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/auth/login");
    }
  }, [authenticated, loading, router]);

  if (loading || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FC] text-[#171D32]">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#171D32]">
      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1360px] px-5 md:px-7 lg:px-8">
          <DashboardNavbar />
        </div>
      </div>

      <div className="w-full border-b border-[#ECEEF5] bg-white">
        <div className="mx-auto max-w-[1360px] px-5 md:px-7 lg:px-8">
          <DashboardTabs />
        </div>
      </div>

      <main className="mx-auto max-w-[1360px] px-5 pb-10 pt-6 md:px-7 lg:px-8">{children}</main>
    </div>
  );
}