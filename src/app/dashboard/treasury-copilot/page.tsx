import TreasuryCopilotChat from "@/components/treasury/TreasuryCopilotChat";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

export default function TreasuryCopilotPage() {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className={cardClassName("hidden p-6 md:block")}>
        <h1 className="text-xl font-semibold text-[#171D32]">Financial Assistant</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#7E8498]">
          Your private finance copilot powered by{" "}
          <a
            href="https://qvac.tether.io/"
            className="font-medium text-primary-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            QVAC
          </a>
          . Balances, contacts, invoices, payout previews, and document-driven workflows — Mboka
          executes only after you confirm actions that move money or change records.
        </p>
      </div>
      <TreasuryCopilotChat />
    </div>
  );
}
