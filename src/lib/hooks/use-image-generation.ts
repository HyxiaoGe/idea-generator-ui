"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { getApiClient } from "@/lib/api-client";
import { showErrorToast } from "@/lib/error-toast";
import { useTaskProgress } from "./use-task-progress";
import type {
  AspectRatio,
  QualityPreset,
  GenerateImageResponse,
  GenerateTaskProgress,
  GeneratedImageInfo,
} from "@/lib/types";
import { getProviderAndModel, mapResolution, getImageUrl } from "@/lib/transforms";
import { getTranslations, interpolate } from "@/lib/i18n";

interface UseImageGenerationOptions {
  onComplete?: () => void;
}

export function useImageGeneration(options?: UseImageGenerationOptions) {
  // Settings state
  const [count, setCount] = useState(1);
  const [resolution, setResolution] = useState("1k");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("balanced");
  const [manualModel, setManualModel] = useState<string | null>(null);
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");

  // Generation state
  const [state, setState] = useState<"empty" | "generating" | "result">("empty");
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Task tracking (unified for single + batch)
  const [taskId, setTaskId] = useState<string | null>(null);

  // Abort controller for in-flight HTTP requests (initial POST or search sync)
  const abortControllerRef = useRef<AbortController | null>(null);

  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  // Unified task progress for both single and batch generation
  const taskProgress = useTaskProgress(taskId, {
    onComplete: (tp: GenerateTaskProgress) => {
      if (tp.task_type === "single" && tp.result) {
        const result = tp.result;
        const imageUrl = getImageUrl(result.image.url || result.image.key);
        setGeneratedImages([
          {
            url: imageUrl,
            provider: result.provider,
            model: result.model,
            model_display_name: result.model_display_name,
            duration: result.duration,
            mode: result.mode,
            settings: result.settings
              ? {
                  aspect_ratio: result.settings.aspect_ratio,
                  resolution: result.settings.resolution,
                }
              : undefined,
            processed_prompt: result.processed_prompt,
            width: result.image.width,
            height: result.image.height,
            created_at: result.created_at,
          },
        ]);
        const t = getTranslations();
        if (result.processed_prompt) {
          toast.success(t.generation.complete, {
            description: interpolate(t.generation.completeWithPrompt, {
              prompt: result.processed_prompt.slice(0, 80),
            }),
          });
        } else {
          toast.success(t.generation.complete);
        }
      } else if (tp.task_type === "batch" && tp.results) {
        const imgs = tp.results
          .map((r) => getImageUrl(r.url || r.key))
          .filter(Boolean)
          .map((url) => ({ url }));
        setGeneratedImages(imgs);
        toast.success(getTranslations().generation.complete);
      }
      setState("result");
      setIsGenerating(false);
      setEnhancePrompt(false);
      setTaskId(null);
      onCompleteRef.current?.();
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

  // Sync task progress to local progress state
  useEffect(() => {
    if (taskId && taskProgress.progress > 0) {
      setProgress(taskProgress.progress);
    }
  }, [taskId, taskProgress.progress]);

  const generate = useCallback(
    async (prompt: string, selectedTemplateId: string | null) => {
      const api = getApiClient();
      const imageManualSelection = manualModel ? getProviderAndModel(manualModel) : null;

      setIsGenerating(true);
      setState("generating");
      setProgress(0);

      try {
        if (count > 1) {
          // Batch generation — delegate to useTaskProgress
          const prompts = Array(count).fill(prompt);
          const batchBody = {
            prompts,
            template_id: selectedTemplateId || undefined,
            settings: {
              aspect_ratio: aspectRatio,
              resolution: mapResolution(resolution),
              safety_level: "moderate" as const,
            },
            enhance_prompt: enhancePrompt || undefined,
          };
          const result = imageManualSelection
            ? await api.batchGenerate(
                batchBody,
                imageManualSelection.provider,
                imageManualSelection.model
              )
            : await api.batchGenerate({ ...batchBody, quality_preset: qualityPreset });

          setTaskId(result.task_id);
        } else {
          // Single image generation
          const singleBody = {
            prompt,
            template_id: selectedTemplateId || undefined,
            settings: {
              aspect_ratio: aspectRatio,
              resolution: mapResolution(resolution),
              safety_level: "moderate" as const,
            },
            enhance_prompt: enhancePrompt || undefined,
          };

          if (searchGrounding) {
            // Search is still synchronous — keep existing inline logic
            setProgress(20);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const result: GenerateImageResponse = imageManualSelection
              ? await api.generateWithSearch(
                  singleBody,
                  imageManualSelection.provider,
                  imageManualSelection.model,
                  controller.signal
                )
              : await api.generateWithSearch(
                  { ...singleBody, quality_preset: qualityPreset },
                  undefined,
                  undefined,
                  controller.signal
                );

            setProgress(100);
            const imageUrl = getImageUrl(result.image.url || result.image.key);
            setGeneratedImages([
              {
                url: imageUrl,
                provider: result.provider,
                model: result.model,
                model_display_name: result.model_display_name,
                duration: result.duration,
                mode: result.mode,
                settings: result.settings
                  ? {
                      aspect_ratio: result.settings.aspect_ratio,
                      resolution: result.settings.resolution,
                    }
                  : undefined,
                processed_prompt: result.processed_prompt,
                width: result.image.width,
                height: result.image.height,
                created_at: result.created_at,
              },
            ]);
            setState("result");
            setIsGenerating(false);
            setEnhancePrompt(false);
            onCompleteRef.current?.();
            const t = getTranslations();
            if (result.processed_prompt) {
              toast.success(t.generation.complete, {
                description: interpolate(t.generation.completeWithPrompt, {
                  prompt: result.processed_prompt.slice(0, 80),
                }),
              });
            } else {
              toast.success(t.generation.complete);
            }
          } else {
            // Async generation — get task_id, delegate to useTaskProgress
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const result = imageManualSelection
              ? await api.generateImage(
                  singleBody,
                  imageManualSelection.provider,
                  imageManualSelection.model,
                  controller.signal
                )
              : await api.generateImage(
                  { ...singleBody, quality_preset: qualityPreset },
                  undefined,
                  undefined,
                  controller.signal
                );

            setTaskId(result.task_id);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("empty");
        setIsGenerating(false);
        setProgress(0);
        showErrorToast(error, getTranslations().generation.failed);
      }
    },
    [count, manualModel, qualityPreset, searchGrounding, enhancePrompt, aspectRatio, resolution]
  );

  const cancel = useCallback(async () => {
    const api = getApiClient();

    // Cancel task via API (works for both single gen_ and batch tasks)
    if (taskId) {
      try {
        const result = await api.cancelTask(taskId);
        const t = getTranslations();
        if (result.refunded_count > 0) {
          toast.info(t.quota.cancelledGeneration, {
            description: interpolate(t.quota.refundedQuota, { count: result.refunded_count }),
          });
        } else {
          toast.info(getTranslations().quota.cancelledGeneration);
        }
      } catch {
        toast.info(getTranslations().quota.cancelledGeneration);
      }
    }

    // Abort in-flight HTTP request (for search sync or the initial POST)
    abortControllerRef.current?.abort();

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

  const generateRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  }, []);

  return {
    // Settings
    count,
    setCount,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    qualityPreset,
    setQualityPreset,
    manualModel,
    setManualModel,
    searchGrounding,
    setSearchGrounding,
    enhancePrompt,
    setEnhancePrompt,
    negativePrompt,
    setNegativePrompt,
    seed,
    setSeed,
    generateRandomSeed,
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
