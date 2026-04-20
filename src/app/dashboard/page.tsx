"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import ExchangeRateTicker from "@/components/dashboard/ExchangeRateTicker";
import WalletSummaryCard from "@/components/dashboard/WalletSummaryCard";
import QuickActions from "@/components/dashboard/QuickActions";
import TransactionVolumeChart from "@/components/dashboard/TransactionVolumeChart";
import UpcomingInvoicesTable from "@/components/dashboard/UpcomingInvoicesTable";
import PendingPaymentsTable from "@/components/dashboard/PendingPaymentsTable";
import RecentTransactionsTable from "@/components/dashboard/RecentTransactionsTable";

export default function DashboardPage() {
  const router = useRouter();
  const { loading, authenticated } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/auth/login");
    }
  }, [loading, authenticated, router]);

  if (loading || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <DashboardNavbar />
      <DashboardTabs />
      <ExchangeRateTicker />

      <div className="px-6 py-6 space-y-6">
        {/* Page heading */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>

        <WalletSummaryCard />
        <QuickActions />
        <TransactionVolumeChart />
        <UpcomingInvoicesTable />
        <PendingPaymentsTable />
        <RecentTransactionsTable />
      </div>
    </div>
  );
}
