"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/lib/dashboard/api";
import type { OrderStatusEvent } from "@/lib/orders";
import {
  OrderStatusSocket,
  type SocketStatus,
} from "@/lib/orders/orderStatusSocket";

export type UseOrderStatusStreamResult = {
  /** Most recent status event received, or null before the first message. */
  event: OrderStatusEvent | null;
  /** Connection lifecycle, for a "Live" / "Reconnecting" indicator. */
  socketStatus: SocketStatus;
  /** True once a terminal status has been received. */
  isTerminal: boolean;
};

type UseOrderStatusStreamOptions = {
  /** Disable the stream (e.g. while the order id is unknown). Default true. */
  enabled?: boolean;
};

/**
 * Subscribe to live status updates for one merchant order and keep the
 * `["transaction", id]` React Query cache in sync, so any UI already reading
 * that query (e.g. the transaction detail page's StatusBadge) updates live
 * without extra wiring. Invalidates the transactions list and dashboard
 * summary once a terminal status arrives.
 *
 * The socket auto-reconnects with backoff, refreshes the token once on auth
 * failure, and closes itself after a terminal status. The hook tears it down
 * on unmount or when `merchantOrderId` changes.
 */
export function useOrderStatusStream(
  merchantOrderId: number | string | null | undefined,
  options: UseOrderStatusStreamOptions = {},
): UseOrderStatusStreamResult {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const [event, setEvent] = useState<OrderStatusEvent | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("closed");
  const [isTerminal, setIsTerminal] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (merchantOrderId == null || merchantOrderId === "") return;

    const key = ["transaction", String(merchantOrderId)] as const;
    let active = true;

    function patchTransactionCache(e: OrderStatusEvent) {
      queryClient.setQueryData<Transaction>(key, (prev) =>
        prev
          ? {
              ...prev,
              status: e.status,
              aggregator_order_id: e.aggregator_order_id ?? prev.aggregator_order_id,
              updated_at: e.updated_at ?? prev.updated_at,
            }
          : prev,
      );
    }

    const socket = new OrderStatusSocket({
      merchantOrderId,
      onEvent: (e) => {
        if (!active) return;
        setEvent(e);
        patchTransactionCache(e);
      },
      onStatusChange: (s) => {
        if (active) setSocketStatus(s);
      },
      onTerminal: (e) => {
        if (!active) return;
        setIsTerminal(true);
        patchTransactionCache(e);
        // The single-order GET may lag the socket; make sure list/summary and
        // the detail query reconcile against the server after settlement.
        void queryClient.invalidateQueries({ queryKey: ["transaction", String(merchantOrderId)] });
        void queryClient.invalidateQueries({ queryKey: ["transactions"] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      },
    });

    // Defer connect() so its synchronous status emission happens after this
    // effect body returns (keeps state updates out of the render-phase effect).
    queueMicrotask(() => {
      if (active) socket.connect();
    });

    return () => {
      active = false;
      socket.close();
      // Clear stale per-subscription UI state so a new order id starts fresh.
      setEvent(null);
      setIsTerminal(false);
      setSocketStatus("closed");
    };
  }, [merchantOrderId, enabled, queryClient]);

  return { event, socketStatus, isTerminal };
}
