"use client";

const rates = [
  { flag: "🇺🇸", pair: "US Dollar", code: "USD", rate: "25.63 Kenyan Shilling..." },
  { flag: "🇰🇪", pair: "Kenyan Shilling", code: "KES", rate: "1.36 Dollar" },
  { flag: "🇳🇬", pair: "Nigerian Naira", code: "NGN", rate: "492.73 Nigerian Value" },
  { flag: "🇺🇸", pair: "US Dollar", code: "USD", rate: "1,577,030 Bitcoin Col..." },
];

export default function ExchangeRateTicker() {
  return (
    <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400 dark:text-gray-500 font-medium shrink-0">
          Jun 14, 2025 Exchange Ticker
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="text-gray-400 dark:text-gray-500 shrink-0">
          Pair market exchange
        </span>
        <div className="flex items-center gap-4 ml-4">
          {rates.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1">
              <span>{r.flag}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{r.code}</span>
              <span className="text-gray-400 dark:text-gray-500">{r.rate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
