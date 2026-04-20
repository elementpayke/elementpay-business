"use client";

const payments = [
  {
    client: "Ayo Vikash",
    date: "Dec 5 - 12:00m",
    type: "Bulk payment",
    method: "M-Pesa Mobile",
    status: "Pending",
    plan: "1/1/2/2025",
    amount: "NRS 917,991",
  },
  {
    client: "Ayo Vikash",
    date: "Dec 5 - 12:00m",
    type: "Deposit",
    method: "Bank transfer",
    status: "Verifying",
    plan: "01/01/11/41",
    amount: "RES 212,029",
  },
];

export default function PendingPaymentsTable() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <h3 className="font-semibold mb-4">Pending payments</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Txn type</th>
              <th className="pb-3 pr-4 font-medium">Payment method</th>
              <th className="pb-3 pr-4 font-medium">Txn status</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-600 dark:text-primary-300">
                      AV
                    </div>
                    <div>
                      <div className="font-medium">{p.client}</div>
                      <div className="text-[11px] text-gray-400">{p.date}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{p.type}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{p.method}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.status === "Pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{p.plan}</td>
                <td className="py-3 font-medium">{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
