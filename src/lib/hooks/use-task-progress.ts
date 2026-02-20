"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getApiClient } from "@/lib/api-client";
import { useWebSocketContext } from "@/lib/ws/ws-provider";
import type { WSMessage } from "@/lib/ws/websocket-client";
import type { GenerateTaskProgress } from "@/lib/types";

interface UseTaskProgressOptions {
  onComplete?: (progress: GenerateTaskProgress) => void;
  onFailed?: (progress: GenerateTaskProgress) => void;
}

interface UseTaskProgressReturn {
  progress: number;
  status: string | null;
}

export function useTaskProgress(
  taskId: string | null,
  options?: UseTaskProgressOptions
): UseTaskProgressReturn {
  const { ws } = useWebSocketContext();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  // Refs for callbacks — assign during render to stay current in concurrent mode
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  const onFailedRef = useRef(options?.onFailed);
  onFailedRef.current = options?.onFailed;

  const isFinishedRef = useRef(false);
  const startTimeRef = useRef(0);

  const applyProgress = useCallback((tp: GenerateTaskProgress) => {
    if (isFinishedRef.current) return;

    // Percentage: single uses progress (0.0-1.0) directly, batch uses progress/total
    const pct =
      tp.task_type === "single"
        ? Math.round(tp.progress * 100)
        : tp.total && tp.total > 0
          ? Math.round((tp.progress / tp.total) * 100)
          : 0;
    setProgress(pct);
    setStatus(tp.status);

    if (tp.status === "completed") {
      isFinishedRef.current = true;
      onCompleteRef.current?.(tp);
    } else if (tp.status === "failed") {
      isFinishedRef.current = true;
      onFailedRef.current?.(tp);
    }
  }, []);

  // Reset state when taskId changes
  useEffect(() => {
    setProgress(0);
    setStatus(null);
    isFinishedRef.current = false;
    startTimeRef.current = Date.now();
  }, [taskId]);

  // Main effect: WS subscription + polling fallback
  useEffect(() => {
    if (!taskId) return;

    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // Recurring poll: fetches then schedules the next one
    const poll = async () => {
      if (cancelled || isFinishedRef.current) return;
      try {
        const tp = await getApiClient().getTaskProgress(taskId);
        if (!cancelled) applyProgress(tp);
      } catch {
        // Polling error — will retry on next interval
      }
      if (!cancelled && !isFinishedRef.current) {
        schedulePoll();
      }
    };

    const schedulePoll = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const interval = elapsed < 30_000 ? 2000 : 5000;
      pollTimer = setTimeout(poll, interval);
    };

    // WS-first strategy with polling safety net
    let unsubProgress: (() => void) | undefined;
    let unsubComplete: (() => void) | undefined;

    if (ws) {
      unsubProgress = ws.on("task_progress", (msg: WSMessage) => {
        const data = msg.data as GenerateTaskProgress;
        if (data.task_id === taskId) {
          applyProgress(data);
        }
      });
      unsubComplete = ws.on("generation_complete", (msg: WSMessage) => {
        const data = msg.data as GenerateTaskProgress;
        if (data.task_id === taskId) {
          applyProgress(data);
        }
      });
    }

    // Always poll: initial fetch + periodic safety net
    // WS delivers faster updates, but polling ensures completion is never missed
    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      unsubProgress?.();
      unsubComplete?.();
    };
  }, [taskId, ws, applyProgress]);

  return { progress, status };
}
