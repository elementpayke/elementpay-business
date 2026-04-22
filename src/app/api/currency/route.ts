import { getCurrencyRateSnapshot } from "@/lib/currency/config";

export async function GET() {
  return Response.json(getCurrencyRateSnapshot(), {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=240",
    },
  });
}
