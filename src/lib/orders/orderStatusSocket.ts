import { getAccessToken, refreshToken } from "@/lib/auth";
import { isTerminalOrderStatus, type OrderStatusEvent } from "@/lib/orders";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** Connection lifecycle, surfaced to the UI for a "Live"/"Reconnecting" badge. */
export type SocketStatus =
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed"
  | "error";

export type OrderStatusSocketOptions = {
  /** Mboka internal order id (from quote accept). */
  merchantOrderId: number | string;
  /** Fired for every `order.status` message (including the initial snapshot). */
  onEvent: (event: OrderStatusEvent) => void;
  /** Fired on every connection lifecycle change. */
  onStatusChange?: (status: SocketStatus) => void;
  /** Fired once when a terminal status arrives (server then closes). */
  onTerminal?: (event: OrderStatusEvent) => void;
  /** Override backoff base (ms). Mostly for tests. */
  baseDelayMs?: number;
  /** Override max backoff (ms). */
  maxDelayMs?: number;
};

/**
 * Resolve the websocket URL for an order's status stream.
 *
 * The REST base is http(s); the socket needs ws(s). An empty base means
 * same-origin, so we fall back to `window.location.origin`. The JWT goes in the
 * `token` query param (URL-encoded) because browser WebSocket clients cannot
 * set Authorization headers.
 */
export function buildOrderStatusWsUrl(
  merchantOrderId: number | string,
  token: string,
): string {
  const httpBase = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const wsBase = httpBase.replace(/^http(s?):\/\//i, (_m, s) => (s ? "wss://" : "ws://"));
  const id = encodeURIComponent(String(merchantOrderId));
  const url = new URL(
    `/api/v1/orders/${id}/status/ws`,
    // URL() needs an absolute base; wsBase is absolute unless something is very
    // wrong, in which case this throws and the caller surfaces an error.
    wsBase,
  );
  url.searchParams.set("token", token);
  return url.toString();
}

// Close codes that mean "the token was rejected" — worth one refresh+retry.
// 1008 = policy violation (common for auth failures); 4401/4403 are app-defined
// auth codes some backends use. Anything in 4000-4499 we treat as app-level.
function isAuthCloseCode(code: number): boolean {
  return code === 1008 || code === 4401 || code === 4403;
}

/**
 * Framework-agnostic client for the order status websocket. Handles ws/wss
 * selection, token-in-query auth, reconnect with capped exponential backoff +
 * jitter, a single token-refresh attempt on auth failure, and stopping cleanly
 * after a terminal status or an explicit `close()`.
 *
 * Construct it, then call `connect()`. Call `close()` to tear down.
 */
export class OrderStatusSocket {
  private ws: WebSocket | null = null;
  private readonly opts: Required<Pick<OrderStatusSocketOptions, "baseDelayMs" | "maxDelayMs">> &
    OrderStatusSocketOptions;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Set once we should never reconnect again (terminal status or close()). */
  private stopped = false;
  /** Guards the one-shot token refresh per disconnect. */
  private refreshedThisCycle = false;

  constructor(options: OrderStatusSocketOptions) {
    this.opts = {
      baseDelayMs: 1000,
      maxDelayMs: 15000,
      ...options,
    };
  }

  connect(): void {
    if (this.stopped) return;
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    // Don't stack sockets.
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      // No session — surface error; a later reconnect (after login) can recover.
      this.emitStatus("error");
      this.scheduleReconnect();
      return;
    }

    let url: string;
    try {
      url = buildOrderStatusWsUrl(this.opts.merchantOrderId, token);
    } catch (err) {
      console.error("[order-ws] could not build url", err);
      this.emitStatus("error");
      return;
    }

    this.emitStatus(this.attempt === 0 ? "connecting" : "reconnecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      console.error("[order-ws] failed to open socket", err);
      this.emitStatus("error");
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.refreshedThisCycle = false;
      this.emitStatus("open");
    };

    socket.onmessage = (ev) => {
      const event = this.parseEvent(ev.data);
      if (!event) return;
      this.opts.onEvent(event);
      if (isTerminalOrderStatus(event.status)) {
        // Server will close after this; stop ourselves so we don't reconnect.
        this.stopped = true;
        this.opts.onTerminal?.(event);
      }
    };

    socket.onerror = () => {
      // onerror is always followed by onclose; let onclose drive reconnect.
      this.emitStatus("error");
    };

    socket.onclose = (ev) => {
      this.ws = null;
      if (this.stopped) {
        this.emitStatus("closed");
        return;
      }
      // One token refresh attempt if the close looks auth-related.
      if (isAuthCloseCode(ev.code) && !this.refreshedThisCycle) {
        this.refreshedThisCycle = true;
        void this.refreshAndReconnect();
        return;
      }
      this.scheduleReconnect();
    };
  }

  /** Stop the socket and prevent any further reconnects. Idempotent. */
  close(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      // Detach handlers first so our onclose doesn't try to reconnect.
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close(1000, "client closed");
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.emitStatus("closed");
  }

  private parseEvent(raw: unknown): OrderStatusEvent | null {
    if (typeof raw !== "string") return null;
    try {
      const obj = JSON.parse(raw) as Partial<OrderStatusEvent>;
      if (obj?.type !== "order.status" || typeof obj.status !== "string") {
        return null;
      }
      return {
        type: "order.status",
        merchant_order_id: Number(obj.merchant_order_id),
        status: obj.status,
        provider_status: obj.provider_status ?? null,
        aggregator_order_id: obj.aggregator_order_id ?? null,
        updated_at: obj.updated_at ?? null,
      };
    } catch {
      return null;
    }
  }

  private async refreshAndReconnect(): Promise<void> {
    this.emitStatus("reconnecting");
    try {
      await refreshToken();
    } catch {
      // Refresh failed — fall through to normal backoff; authedFetch elsewhere
      // will eventually redirect to login if the session is truly dead.
    }
    if (this.stopped) return;
    this.scheduleReconnect(0);
  }

  private scheduleReconnect(delayOverride?: number): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;
    this.emitStatus("reconnecting");
    const delay = delayOverride ?? this.backoffDelay();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attempt += 1;
      this.connect();
    }, delay);
  }

  private backoffDelay(): number {
    const exp = Math.min(
      this.opts.maxDelayMs,
      this.opts.baseDelayMs * 2 ** this.attempt,
    );
    // Full jitter to avoid thundering-herd reconnects.
    return Math.round(Math.random() * exp);
  }

  private emitStatus(status: SocketStatus): void {
    this.opts.onStatusChange?.(status);
  }
}
