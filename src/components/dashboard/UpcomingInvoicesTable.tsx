"use client";

const invoices = [
  {
    client: "Ayo Vikash",
    wallet: "Wallet name",
    invoiceId: "INV-MH-0012",
    timeframe: "01/09/2018 - 05/04/80",
    transactionId: "txn-IXTN14E IDS",
    dueDate: "01/01/01/2015",
    status: "Pending",
    expected: "KRS 917,991",
  },
  {
    client: "Ayo Vikash",
    wallet: "Dollar corp",
    invoiceId: "Inv-2454-JN58",
    timeframe: "12/12/2023 12/04/26",
    transactionId: "txn-JJ24 C780",
    dueDate: "12/01/12/2021",
    status: "Pending",
    expected: "RES 212,029",
  },
  {
    client: "Ayo Vikash",
    wallet: "Wallet name",
    invoiceId: "INV-MH-0012",
    timeframe: "01/09/2018 - 05/04/80",
    transactionId: "txn-IXTN14E IDS",
    dueDate: "01/01/01/2015",
    status: "Estimating",
    expected: "KRS 917,991",
  },
];

export default function UpcomingInvoicesTable() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <h3 className="font-semibold mb-4">Upcoming invoice payments</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Receiving wallet</th>
              <th className="pb-3 pr-4 font-medium">Invoice ID</th>
              <th className="pb-3 pr-4 font-medium">Timeframe</th>
              <th className="pb-3 pr-4 font-medium">Transaction ID</th>
              <th className="pb-3 pr-4 font-medium">Due date</th>
              <th className="pb-3 pr-4 font-medium">Invoice status</th>
              <th className="pb-3 font-medium">Expected receipt</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-600 dark:text-primary-300">
                      AV
                    </div>
                    {inv.client}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-primary-500 underline cursor-pointer">{inv.wallet}</span>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{inv.invoiceId}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{inv.timeframe}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{inv.transactionId}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{inv.dueDate}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      inv.status === "Pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 font-medium">{inv.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
