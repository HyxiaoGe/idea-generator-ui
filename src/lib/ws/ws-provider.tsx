"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { WebSocketClient } from "./websocket-client";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { getTranslations, interpolate } from "@/lib/i18n";

interface WSContextType {
  ws: WebSocketClient | null;
}

const WSContext = createContext<WSContextType>({ ws: null });

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const ws = new WebSocketClient({
      getToken: () => token,
    });

    // Register global handlers
    const unsubQuota = ws.on("quota_warning", (msg) => {
      const data = msg.data as { remaining?: number; message?: string };
      const t = getTranslations();
      toast.warning(t.quota.warning, {
        description:
          data.message || interpolate(t.quota.remainingQuota, { n: data.remaining ?? 0 }),
      });
    });

    const unsubComplete = ws.on("generation_complete", (msg) => {
      const data = msg.data as { prompt?: string };
      const t = getTranslations();
      toast.success(t.quota.generationComplete, {
        description: data.prompt ? `"${data.prompt.slice(0, 30)}..."` : undefined,
      });
    });

    ws.connect();
    setWsClient(ws);

    return () => {
      unsubQuota();
      unsubComplete();
      ws.disconnect();
      setWsClient(null);
    };
  }, [isAuthenticated, token]);

  return <WSContext.Provider value={{ ws: wsClient }}>{children}</WSContext.Provider>;
}

export function useWebSocketContext(): WSContextType {
  return useContext(WSContext);
}
