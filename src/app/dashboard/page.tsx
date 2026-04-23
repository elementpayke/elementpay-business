import ExchangeRateTicker from "@/components/dashboard/ExchangeRateTicker";
import WalletSummaryCard from "@/components/dashboard/WalletSummaryCard";
import QuickActions from "@/components/dashboard/QuickActions";
import TransactionVolumeChart from "@/components/dashboard/TransactionVolumeChart";
import UpcomingInvoicesTable from "@/components/dashboard/UpcomingInvoicesTable";
import PendingPaymentsTable from "@/components/dashboard/PendingPaymentsTable";
import RecentTransactionsTable from "@/components/dashboard/RecentTransactionsTable";
import { PageHeader } from "@/components/dashboard/DashboardPrimitives";

export default function DashboardPage() {
  return (
    <section className="space-y-5">
      <PageHeader title="Dashboard" />
      <ExchangeRateTicker />
      <WalletSummaryCard />
      <QuickActions />
      <TransactionVolumeChart />
      <UpcomingInvoicesTable />
      <PendingPaymentsTable />
      <RecentTransactionsTable />
    </section>
  );
}
