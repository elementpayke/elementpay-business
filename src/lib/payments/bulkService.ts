"use client";

import {
  executeBulkRow,
  MAX_BULK_EXECUTE_ROWS,
  type BulkLineFailure,
  type BulkLineSuccess,
  type BulkSenderContext,
} from "@/lib/payments/bulkOfframp";
import type {
  BulkBatchResult,
  BulkParsedRow,
  BulkProcessingStage,
  BulkProgressSnapshot,
} from "@/lib/payments/bulkTypes";

export type SubmitBatchRequest = {
  validRows: BulkParsedRow[];
  reference?: string;
  sender: BulkSenderContext;
};

type BatchRun = {
  batchId: string;
  createdAt: number;
  totalRecipients: number;
  processed: number;
  successful: number;
  failed: number;
  failedRows: BulkParsedRow[];
  lineResults: BulkLineSuccess[];
  done: boolean;
  error?: string;
};

const runs = new Map<string, BatchRun>();

function stageForRun(run: BatchRun): BulkProcessingStage {
  if (run.done) return "done";
  if (run.processed === 0) return "validating-batch";
  if (run.processed < run.totalRecipients) return "sending-transfers";
  return "finalizing";
}

export async function submitBulkBatch(req: SubmitBatchRequest): Promise<{ batchId: string }> {
  if (!req.sender.refundAddress) {
    throw new Error("Business treasury wallet is required before starting a bulk payout.");
  }
  if (req.validRows.length === 0) {
    throw new Error("No valid recipients to pay.");
  }
  if (req.validRows.length > MAX_BULK_EXECUTE_ROWS) {
    throw new Error(
      `Bulk payout is limited to ${MAX_BULK_EXECUTE_ROWS} recipients per batch in this release.`,
    );
  }

  const batchId = `bulk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const batchRef = req.reference?.trim() || batchId;

  const run: BatchRun = {
    batchId,
    createdAt: Date.now(),
    totalRecipients: req.validRows.length,
    processed: 0,
    successful: 0,
    failed: 0,
    failedRows: [],
    lineResults: [],
    done: false,
  };
  runs.set(batchId, run);

  void processBatch(batchId, req.validRows, batchRef, req.sender);

  return { batchId };
}

async function processBatch(
  batchId: string,
  rows: BulkParsedRow[],
  batchRef: string,
  sender: BulkSenderContext,
): Promise<void> {
  const run = runs.get(batchId);
  if (!run) return;

  const failures: BulkLineFailure[] = [];

  for (const row of rows) {
    try {
      const line = await executeBulkRow(row, sender, batchRef);
      run.lineResults.push(line);
      run.successful += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payout failed";
      failures.push({ row, message });
      run.failedRows.push(row);
      run.failed += 1;
    }
    run.processed += 1;
  }

  run.done = true;
  if (failures.length === rows.length) {
    run.error = failures[0]?.message ?? "All payouts in this batch failed.";
  }
}

export async function getBulkBatchSnapshot(batchId: string): Promise<BulkProgressSnapshot> {
  const run = runs.get(batchId);
  if (!run) {
    return {
      stage: "done",
      totalRecipients: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      pending: 0,
    };
  }

  return {
    stage: stageForRun(run),
    totalRecipients: run.totalRecipients,
    processed: run.processed,
    successful: run.successful,
    failed: run.failed,
    pending: Math.max(0, run.totalRecipients - run.processed),
  };
}

export async function finalizeBulkBatch(batchId: string, startedAt: number): Promise<BulkBatchResult> {
  const run = runs.get(batchId);
  if (!run) {
    return {
      batchId,
      totalRecipients: 0,
      successful: 0,
      failed: 0,
      processingMs: Date.now() - startedAt,
      completedAt: Date.now(),
      failedRows: [],
      lineResults: [],
    };
  }

  if (run.error && run.successful === 0) {
    throw new Error(run.error);
  }

  return {
    batchId,
    totalRecipients: run.totalRecipients,
    successful: run.successful,
    failed: run.failed,
    processingMs: Date.now() - startedAt,
    completedAt: Date.now(),
    failedRows: run.failedRows,
    lineResults: run.lineResults,
  };
}

export function toReconciliationCsv(result: BulkBatchResult): string {
  const header =
    "row_index,external_order_id,quote_id,merchant_order_id,tx_hash,fiat_amount,crypto_amount";
  const lines = (result.lineResults ?? []).map((line) =>
    [
      line.rowIndex,
      line.externalOrderId,
      line.quoteId,
      line.merchantOrderId,
      line.txHash ?? "",
      line.fiatAmount,
      line.cryptoAmount,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}
