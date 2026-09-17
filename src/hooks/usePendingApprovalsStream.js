import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { approvalsApi } from "@/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
const RECONNECT_DELAY_MS = 5000;

// Pushes pending-approval counts into ['pendingApprovalsCount'] as they change, instead of Layout.jsx
// polling GET /approvals/pending-counts (a full-org scan) on a fixed interval. Falls back to a slow
// poll (see Layout.jsx's refetchInterval) as a safety net for dropped connections or missed emits.
export function usePendingApprovalsStream(enabled) {
  const queryClient = useQueryClient();
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let reconnectTimer = null;

    const connect = async () => {
      if (cancelled) return;
      let ticket;
      try {
        ({ ticket } = await approvalsApi.getPendingCountsStreamToken());
      } catch {
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        return;
      }
      if (cancelled) return;

      const source = new EventSource(`${API_URL}/approvals/pending-counts/stream?ticket=${encodeURIComponent(ticket)}`);
      sourceRef.current = source;

      source.addEventListener("counts", (event) => {
        try {
          queryClient.setQueryData(["pendingApprovalsCount"], JSON.parse(event.data));
        } catch {
          // ignore malformed payload, next event (or the fallback poll) will catch up
        }
      });

      source.onerror = () => {
        // The stream ticket is single-use/short-lived, so the browser's native EventSource retry
        // (same URL, same stale ticket) would just loop on 401s - close it and reconnect with a fresh one.
        source.close();
        if (sourceRef.current === source) sourceRef.current = null;
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled, queryClient]);
}
