import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // TODO: Fetch real transactions from your data store
  const transactions: unknown[] = [];

  return NextResponse.json({
    transactions,
    pagination: {
      page,
      limit,
      total: 0,
    },
  });
}
