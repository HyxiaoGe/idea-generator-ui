"use client";

import { useEffect, useCallback } from "react";
import { useWebSocketContext } from "./ws-provider";
import type { WSMessageType, WSMessage } from "./websocket-client";

/**
 * Hook to subscribe to WebSocket messages.
 *
 * @param type - Message type to listen for
 * @param handler - Callback when a message of this type is received
 */
export function useWebSocket(
  type: WSMessageType,
  handler: (data: unknown) => void
): { isConnected: boolean } {
  const { ws } = useWebSocketContext();

  useEffect(() => {
    if (!ws) return;

    const unsubscribe = ws.on(type, (msg: WSMessage) => {
      handler(msg.data);
    });

    return unsubscribe;
  }, [ws, type, handler]);

  return {
    isConnected: ws?.isConnected ?? false,
  };
}

/**
 * Hook to subscribe to all WebSocket messages.
 */
export function useWebSocketAll(handler: (message: WSMessage) => void): { isConnected: boolean } {
  const { ws } = useWebSocketContext();

  useEffect(() => {
    if (!ws) return;

    const unsubscribe = ws.onAny(handler);

    return unsubscribe;
  }, [ws, handler]);

  return {
    isConnected: ws?.isConnected ?? false,
  };
}
