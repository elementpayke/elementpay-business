"use client";

import { create } from "zustand";
import type {
  BulkBatchResult,
  BulkError,
  BulkParseResult,
  BulkPhase,
  BulkProgressSnapshot,
  BulkUploadedFileMeta,
} from "@/lib/payments/bulkTypes";

export type RowFilter = "all" | "valid" | "invalid";

type BulkPaymentState = {
  phase: BulkPhase;
  uploadedFile: BulkUploadedFileMeta | null;
  parseResult: BulkParseResult | null;
  reference: string;
  sourceWalletAddress: string | null;
  search: string;
  rowFilter: RowFilter;
  page: number;
  pageSize: 10 | 25 | 50;
  batchId: string | null;
  progress: BulkProgressSnapshot | null;
  result: BulkBatchResult | null;
  error: BulkError | null;
};

type BulkPaymentActions = {
  setPhase: (phase: BulkPhase) => void;
  setUploadedFile: (meta: BulkUploadedFileMeta | null) => void;
  setParseResult: (result: BulkParseResult | null) => void;
  setReference: (reference: string) => void;
  setSourceWallet: (address: string | null) => void;
  setSearch: (search: string) => void;
  setRowFilter: (filter: RowFilter) => void;
  setPage: (page: number) => void;
  setPageSize: (size: 10 | 25 | 50) => void;
  setBatchId: (id: string | null) => void;
  setProgress: (snapshot: BulkProgressSnapshot) => void;
  setResult: (result: BulkBatchResult) => void;
  setError: (error: BulkError) => void;
  reset: () => void;
};

export type BulkPaymentStore = BulkPaymentState & BulkPaymentActions;

const initialState: BulkPaymentState = {
  phase: "csv-upload",
  uploadedFile: null,
  parseResult: null,
  reference: "",
  sourceWalletAddress: null,
  search: "",
  rowFilter: "all",
  page: 1,
  pageSize: 25,
  batchId: null,
  progress: null,
  result: null,
  error: null,
};

export const useBulkPaymentStore = create<BulkPaymentStore>()((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setParseResult: (parseResult) => set({ parseResult, page: 1 }),
  setReference: (reference) => set({ reference }),
  setSourceWallet: (sourceWalletAddress) => set({ sourceWalletAddress }),
  setSearch: (search) => set({ search, page: 1 }),
  setRowFilter: (rowFilter) => set({ rowFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setBatchId: (batchId) => set({ batchId }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, phase: "success" }),
  setError: (error) => set({ error, phase: "error" }),

  reset: () => set({ ...initialState }),
}));

export function bulkPhaseToStep(phase: BulkPhase): 1 | 2 | 3 {
  if (phase === "csv-upload" || phase === "csv-validating") return 1;
  if (phase === "recipients-preview") return 2;
  return 3;
}
