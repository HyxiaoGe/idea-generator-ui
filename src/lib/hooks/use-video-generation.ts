"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { getApiClient } from "@/lib/api-client";
import { showErrorToast } from "@/lib/error-toast";
import { useTaskProgress } from "./use-task-progress";
import type { AspectRatio, ProviderInfo, GeneratedImageInfo, GeneratedImage } from "@/lib/types";
import { getProviderAndModel, mapResolution, getImageUrl } from "@/lib/transforms";

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
    onComplete: (results: GeneratedImage[]) => {
      const imgs = results
        .map((r) => getImageUrl(r.url || r.key))
        .filter(Boolean)
        .map((url) => ({ url }));
      setGeneratedImages(imgs.length > 0 ? imgs : []);
      setState("result");
      setIsGenerating(false);
      setTaskId(null);
      onCompleteRef.current?.();
      toast.success("视频生成完成！");
    },
    onFailed: (errors: string[]) => {
      setState("empty");
      setIsGenerating(false);
      setTaskId(null);
      toast.error("生成失败", {
        description: errors.join(", ") || "请重试",
      });
    },
  });

  // Sync task progress
  if (taskId && videoProgress.progress > progress) {
    setProgress(videoProgress.progress);
  }

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
        showErrorToast(error, "生成失败");
      }
    },
    [videoModel, videoAspectRatio, videoResolution]
  );

  const cancel = useCallback(async () => {
    if (!taskId) return;
    const api = getApiClient();
    try {
      const result = await api.cancelTask(taskId);
      if (result.refunded_count > 0) {
        toast.info("已取消生成", { description: `已退还 ${result.refunded_count} 次配额` });
      } else {
        toast.info("已取消生成");
      }
    } catch {
      toast.info("已取消生成");
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
