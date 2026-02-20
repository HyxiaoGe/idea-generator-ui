"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { getApiClient } from "@/lib/api-client";
import { showErrorToast } from "@/lib/error-toast";
import { useTaskProgress } from "./use-task-progress";
import type {
  AspectRatio,
  ProviderInfo,
  GeneratedImageInfo,
  GenerateTaskProgress,
} from "@/lib/types";
import { getProviderAndModel, mapResolution, getImageUrl } from "@/lib/transforms";
import { getTranslations, interpolate } from "@/lib/i18n";

interface UseVideoGenerationOptions {
  onComplete?: () => void;
}

export function useVideoGeneration(isAuthenticated: boolean, options?: UseVideoGenerationOptions) {
  // Settings state
  const [videoModel, setVideoModel] = useState("");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [videoDuration, setVideoDuration] = useState("4");
  const [videoFrameRate, setVideoFrameRate] = useState("30");
  const [videoAspectRatio, setVideoAspectRatio] = useState<AspectRatio>("16:9");
  const [videoMotionStrength, setVideoMotionStrength] = useState("medium");

  // Generation state
  const [state, setState] = useState<"empty" | "generating" | "result">("empty");
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Task tracking
  const [taskId, setTaskId] = useState<string | null>(null);

  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  // Fetch video providers from API
  const { data: videoProvidersData } = useSWR<{ providers: ProviderInfo[] }>(
    isAuthenticated ? "/video/providers" : null
  );
  const videoProviders = videoProvidersData?.providers;

  useEffect(() => {
    if (videoProviders?.length && !videoModel) {
      const first = videoProviders[0];
      setVideoModel(`${first.name}:${first.models[0].id}`);
    }
  }, [videoProviders, videoModel]);

  const videoModelOptions = useMemo(
    () =>
      (videoProviders || []).flatMap((p) =>
        p.models.map((m) => ({
          value: `${p.name}:${m.id}`,
          label: `${p.display_name} ${m.name}`,
        }))
      ),
    [videoProviders]
  );

  // Use WebSocket-first task progress
  const videoProgress = useTaskProgress(taskId, {
    onComplete: (tp: GenerateTaskProgress) => {
      const results = tp.results || [];
      const imgs = results
        .map((r) => getImageUrl(r.url || r.key))
        .filter(Boolean)
        .map((url) => ({ url }));
      setGeneratedImages(imgs.length > 0 ? imgs : []);
      setState("result");
      setIsGenerating(false);
      setTaskId(null);
      onCompleteRef.current?.();
      toast.success(getTranslations().generation.videoComplete);
    },
    onFailed: (tp: GenerateTaskProgress) => {
      setState("empty");
      setIsGenerating(false);
      setTaskId(null);
      const t = getTranslations();
      const errorMsg = tp.error || tp.errors?.join(", ") || t.generation.failedRetry;
      toast.error(t.generation.failed, { description: errorMsg });
    },
  });

  // Sync task progress (must be in useEffect, not render phase)
  useEffect(() => {
    if (taskId && videoProgress.progress > 0) {
      setProgress(videoProgress.progress);
    }
  }, [taskId, videoProgress.progress]);

  const generate = useCallback(
    async (prompt: string, selectedTemplateId: string | null) => {
      const api = getApiClient();
      const videoSelection = getProviderAndModel(videoModel);

      setIsGenerating(true);
      setState("generating");
      setProgress(0);

      try {
        const result = await api.generateVideo(
          {
            prompt,
            template_id: selectedTemplateId || undefined,
            settings: {
              aspect_ratio: videoAspectRatio,
              resolution: mapResolution(videoResolution),
              safety_level: "moderate",
            },
          },
          videoSelection.provider,
          videoSelection.model
        );

        setTaskId(result.task_id);
      } catch (error) {
        setState("empty");
        setIsGenerating(false);
        setProgress(0);
        showErrorToast(error, getTranslations().generation.failed);
      }
    },
    [videoModel, videoAspectRatio, videoResolution]
  );

  const cancel = useCallback(async () => {
    if (!taskId) return;
    const api = getApiClient();
    try {
      const result = await api.cancelTask(taskId);
      const t = getTranslations();
      if (result.refunded_count > 0) {
        toast.info(t.quota.cancelledGeneration, {
          description: interpolate(t.quota.refundedQuota, { count: result.refunded_count }),
        });
      } else {
        toast.info(t.quota.cancelledGeneration);
      }
    } catch {
      toast.info(getTranslations().quota.cancelledGeneration);
    }
    setState("empty");
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
  }, [taskId]);

  const reset = useCallback(() => {
    setState("empty");
    setProgress(0);
    setGeneratedImages([]);
    setTaskId(null);
  }, []);

  return {
    // Settings
    videoModel,
    setVideoModel,
    videoResolution,
    setVideoResolution,
    videoDuration,
    setVideoDuration,
    videoFrameRate,
    setVideoFrameRate,
    videoAspectRatio,
    setVideoAspectRatio,
    videoMotionStrength,
    setVideoMotionStrength,
    videoModelOptions,
    // Generation state
    state,
    progress,
    generatedImages,
    isGenerating,
    // Actions
    generate,
    cancel,
    reset,
  };
}
