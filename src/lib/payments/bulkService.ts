"use client";

import type {
  BulkBatchResult,
  BulkParsedRow,
  BulkProcessingStage,
  BulkProgressSnapshot,
} from "@/lib/payments/bulkTypes";

type SubmitBatchRequest = {
  validRows: BulkParsedRow[];
  reference?: string;
};

type SubmittedBatch = {
  batchId: string;
  createdAt: number;
  totalRecipients: number;
  failedRows: BulkParsedRow[];
};

const STAGE_TIMINGS: Record<Exclude<BulkProcessingStage, "done">, number> = {
  "validating-batch": 1200,
  "reserving-fees": 1200,
  "initializing-queue": 1500,
  "sending-transfers": 4500,
  finalizing: 1000,
};

const batches = new Map<string, SubmittedBatch>();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitBulkBatch(req: SubmitBatchRequest): Promise<{ batchId: string }> {
  await wait(600);
  const batchId = `bulk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const deterministicFailureCount = Math.min(
    Math.max(0, Math.floor(req.validRows.length * 0.03)),
    3,
  );
  const failedRows = req.validRows.slice(0, deterministicFailureCount);
  batches.set(batchId, {
    batchId,
    createdAt: Date.now(),
    totalRecipients: req.validRows.length,
    failedRows,
  });
  return { batchId };
}

function stageAtElapsed(elapsed: number): BulkProcessingStage {
  const t1 = STAGE_TIMINGS["validating-batch"];
  const t2 = t1 + STAGE_TIMINGS["reserving-fees"];
  const t3 = t2 + STAGE_TIMINGS["initializing-queue"];
  const t4 = t3 + STAGE_TIMINGS["sending-transfers"];
  const t5 = t4 + STAGE_TIMINGS.finalizing;
  if (elapsed < t1) return "validating-batch";
  if (elapsed < t2) return "reserving-fees";
  if (elapsed < t3) return "initializing-queue";
  if (elapsed < t4) return "sending-transfers";
  if (elapsed < t5) return "finalizing";
  return "done";
}

export async function getBulkBatchSnapshot(batchId: string): Promise<BulkProgressSnapshot> {
  await wait(300);
  const record = batches.get(batchId);
  if (!record) {
    return {
      stage: "done",
      totalRecipients: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      pending: 0,
    };
  }
  const elapsed = Date.now() - record.createdAt;
  const stage = stageAtElapsed(elapsed);
  const total = record.totalRecipients;
  const failed = record.failedRows.length;

  const t1 = STAGE_TIMINGS["validating-batch"];
  const t2 = t1 + STAGE_TIMINGS["reserving-fees"];
  const t3 = t2 + STAGE_TIMINGS["initializing-queue"];
  const t4 = t3 + STAGE_TIMINGS["sending-transfers"];

  let processed: number;
  if (stage === "validating-batch" || stage === "reserving-fees" || stage === "initializing-queue") {
    processed = 0;
  } else if (stage === "sending-transfers") {
    const ratio = Math.min(1, Math.max(0, (elapsed - t3) / (t4 - t3)));
    processed = Math.floor(total * ratio);
  } else {
    processed = total;
  }

  const successful = Math.max(0, processed - Math.min(failed, processed));
  const pending = Math.max(0, total - processed);

  return {
    stage,
    totalRecipients: total,
    processed,
    successful,
    failed: Math.min(failed, processed),
    pending,
  };
}

export async function finalizeBulkBatch(batchId: string, startedAt: number): Promise<BulkBatchResult> {
  const record = batches.get(batchId);
  const total = record?.totalRecipients ?? 0;
  const failed = record?.failedRows.length ?? 0;
  return {
    batchId,
    totalRecipients: total,
    successful: total - failed,
    failed,
    processingMs: Date.now() - startedAt,
    completedAt: Date.now(),
    failedRows: record?.failedRows ?? [],
  };
}
