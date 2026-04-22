export type SupportedCurrency = "USD" | "KES";

export type CurrencyRateSnapshot = {
  baseCurrency: "USD";
  quotes: {
    KES: number;
  };
  fetchedAt: string;
  refreshIntervalMs: number;
};

const DEFAULT_USD_KES_RATE = 129;
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function parseRate(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getUsdKesRate() {
  return (
    parseRate(process.env.USD_KES_RATE) ??
    parseRate(process.env.NEXT_PUBLIC_USD_KES_RATE) ??
    DEFAULT_USD_KES_RATE
  );
}

export function getCurrencyRateSnapshot(): CurrencyRateSnapshot {
  return {
    baseCurrency: "USD",
    quotes: {
      KES: getUsdKesRate(),
    },
    fetchedAt: new Date().toISOString(),
    refreshIntervalMs: DEFAULT_REFRESH_INTERVAL_MS,
  };
}
