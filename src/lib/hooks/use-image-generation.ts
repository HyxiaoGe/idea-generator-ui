"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { getApiClient } from "@/lib/api-client";
import { useTaskProgress } from "./use-task-progress";
import type {
  AspectRatio,
  QualityPreset,
  GenerateImageResponse,
  GeneratedImageInfo,
  GeneratedImage,
} from "@/lib/types";
import { getProviderAndModel, mapResolution, getImageUrl } from "@/lib/transforms";

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

  // Batch task tracking
  const [batchTaskId, setBatchTaskId] = useState<string | null>(null);

  const onCompleteRef = useRef(options?.onComplete);
  useEffect(() => {
    onCompleteRef.current = options?.onComplete;
  });

  // Use WebSocket-first task progress for batch generation
  const batchProgress = useTaskProgress(batchTaskId, {
    onComplete: (results: GeneratedImage[]) => {
      const imgs = results
        .map((r) => getImageUrl(r.url || r.key))
        .filter(Boolean)
        .map((url) => ({ url }));
      setGeneratedImages(imgs);
      setState("result");
      setIsGenerating(false);
      setEnhancePrompt(false);
      setBatchTaskId(null);
      onCompleteRef.current?.();
      toast.success("生成完成！");
    },
    onFailed: (errors: string[]) => {
      setState("empty");
      setIsGenerating(false);
      setBatchTaskId(null);
      toast.error("生成失败", {
        description: errors.join(", ") || "请重试",
      });
    },
  });

  // Sync task progress to local progress state
  if (batchTaskId && batchProgress.progress > progress) {
    setProgress(batchProgress.progress);
  }

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

          setBatchTaskId(result.task_id);
        } else {
          // Single image generation
          setProgress(20);

          const generateFn = searchGrounding
            ? api.generateWithSearch.bind(api)
            : api.generateImage.bind(api);

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

          const result: GenerateImageResponse = imageManualSelection
            ? await generateFn(
                singleBody,
                imageManualSelection.provider,
                imageManualSelection.model
              )
            : await generateFn({ ...singleBody, quality_preset: qualityPreset });

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
          if (result.processed_prompt) {
            toast.success("生成完成！", {
              description: `优化后的提示词: ${result.processed_prompt.slice(0, 80)}...`,
            });
          } else {
            toast.success("生成完成！");
          }
        }
      } catch (error) {
        setState("empty");
        setIsGenerating(false);
        setProgress(0);
        const message = error instanceof Error ? error.message : "生成失败，请重试";
        toast.error("生成失败", { description: message });
      }
    },
    [count, manualModel, qualityPreset, searchGrounding, enhancePrompt, aspectRatio, resolution]
  );

  const reset = useCallback(() => {
    setState("empty");
    setProgress(0);
    setGeneratedImages([]);
    setBatchTaskId(null);
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
    reset,
  };
}
