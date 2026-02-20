"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getApiClient } from "@/lib/api-client";
import { useWebSocketContext } from "@/lib/ws/ws-provider";
import type { WSMessage } from "@/lib/ws/websocket-client";
import type { TaskProgress, GeneratedImage } from "@/lib/types";

interface UseTaskProgressOptions {
  onComplete?: (results: GeneratedImage[]) => void;
  onFailed?: (errors: string[]) => void;
}

interface UseTaskProgressReturn {
  progress: number;
  status: string | null;
  results: GeneratedImage[];
  errors: string[];
}

export function useTaskProgress(
  taskId: string | null,
  options?: UseTaskProgressOptions
): UseTaskProgressReturn {
  const { ws } = useWebSocketContext();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Refs for callbacks — assign during render to stay current in concurrent mode
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  const onFailedRef = useRef(options?.onFailed);
  onFailedRef.current = options?.onFailed;

  const isFinishedRef = useRef(false);
  const startTimeRef = useRef(0);

  const applyProgress = useCallback((tp: TaskProgress) => {
    if (isFinishedRef.current) return;

    const pct = tp.total > 0 ? Math.round((tp.progress / tp.total) * 100) : 0;
    setProgress(pct);
    setStatus(tp.status);

    if (tp.status === "completed") {
      isFinishedRef.current = true;
      setResults(tp.results);
      setErrors(tp.errors);
      onCompleteRef.current?.(tp.results);
    } else if (tp.status === "failed") {
      isFinishedRef.current = true;
      setErrors(tp.errors);
      onFailedRef.current?.(tp.errors);
    }
  }, []);

  // Reset state when taskId changes
  useEffect(() => {
    setProgress(0);
    setStatus(null);
    setResults([]);
    setErrors([]);
    isFinishedRef.current = false;
    startTimeRef.current = Date.now();
  }, [taskId]);

  // Main effect: WS subscription + polling fallback
  useEffect(() => {
    if (!taskId) return;

    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // One-shot fetch for current state (no chaining)
    const fetchOnce = async () => {
      if (cancelled || isFinishedRef.current) return;
      try {
        const tp = await getApiClient().getTaskProgress(taskId);
        if (!cancelled) applyProgress(tp);
      } catch {
        // fetch error — WS will deliver updates
      }
    };

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
        const data = msg.data as TaskProgress;
        if (data.task_id === taskId) {
          applyProgress(data);
        }
      });
      unsubComplete = ws.on("generation_complete", (msg: WSMessage) => {
        const data = msg.data as TaskProgress;
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

  return { progress, status, results, errors };
}
