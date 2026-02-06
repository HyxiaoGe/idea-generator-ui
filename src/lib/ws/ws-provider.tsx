"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { WebSocketClient } from "./websocket-client";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

interface WSContextType {
  ws: WebSocketClient | null;
}

const WSContext = createContext<WSContextType>({ ws: null });

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if we were connected
      wsRef.current?.disconnect();
      wsRef.current = null;
      return;
    }

    const ws = new WebSocketClient({
      getToken: () => token,
    });

    wsRef.current = ws;

    // Register global handlers
    const unsubQuota = ws.on("quota_warning", (msg) => {
      const data = msg.data as { remaining?: number; message?: string };
      toast.warning("配额警告", {
        description: data.message || `剩余配额: ${data.remaining}`,
      });
    });

    const unsubComplete = ws.on("generation_complete", (msg) => {
      const data = msg.data as { prompt?: string };
      toast.success("生成完成", {
        description: data.prompt ? `"${data.prompt.slice(0, 30)}..."` : undefined,
      });
    });

    ws.connect();

    return () => {
      unsubQuota();
      unsubComplete();
      ws.disconnect();
      wsRef.current = null;
    };
  }, [isAuthenticated, token]);

  return <WSContext.Provider value={{ ws: wsRef.current }}>{children}</WSContext.Provider>;
}

export function useWebSocketContext(): WSContextType {
  return useContext(WSContext);
}
