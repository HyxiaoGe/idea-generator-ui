"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { ImageLightbox, type LightboxSlide } from "@/components/image-lightbox";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuota } from "@/lib/quota/quota-context";
import { useTranslation } from "@/lib/i18n";
import type { HistoryItem } from "@/lib/types";
import {
  formatRelativeTime,
  getModeDisplayName,
  getImageUrl,
  inferContentType,
} from "@/lib/transforms";

// Hooks
import { useImageGeneration } from "@/lib/hooks/use-image-generation";
import { useVideoGeneration } from "@/lib/hooks/use-video-generation";
import { useExamplePrompts } from "@/lib/hooks/use-example-prompts";

// Components
import { PreviewPanel } from "@/components/home/preview-panel";
import { PromptInput } from "@/components/home/prompt-input";
import { ImageParams } from "@/components/home/image-params";
import { VideoParams } from "@/components/home/video-params";
import { AdvancedSettings } from "@/components/home/advanced-settings";
import { ModeCards } from "@/components/home/mode-cards";
import { RecentGenerations } from "@/components/home/recent-generations";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { checkBeforeGenerate, refreshQuota } = useQuota();
  const { t } = useTranslation();

  const contentType = (searchParams.get("type") as "image" | "video") || "image";
  const templatePrompt = searchParams.get("prompt") || "";

  // Shared state
  const [prompt, setPrompt] = useState(templatePrompt);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // History SWR (shared between hooks and recent panel)
  const {
    data: historyData,
    isLoading: isLoadingRecent,
    mutate: refreshHistory,
  } = useSWR<{ items: HistoryItem[] }>(isAuthenticated ? `/history?limit=6` : null);
  const recentGenerations = useMemo(() => historyData?.items || [], [historyData]);

  // Generation hooks
  const imageGen = useImageGeneration({
    onComplete: () => {
      refreshQuota();
      refreshHistory();
    },
  });

  const videoGen = useVideoGeneration(isAuthenticated, {
    onComplete: () => {
      refreshQuota();
      refreshHistory();
    },
  });

  // Example prompts hook
  const prompts = useExamplePrompts(isAuthenticated);

  // Active generation based on contentType
  const activeGen = contentType === "image" ? imageGen : videoGen;

  // Per-mode prompt draft refs
  const imagePromptRef = useRef("");
  const videoPromptRef = useRef("");
  const prevContentTypeRef = useRef(contentType);

  // Save/restore prompt drafts on contentType change
  useEffect(() => {
    const prev = prevContentTypeRef.current;
    prevContentTypeRef.current = contentType;

    if (prev === contentType) return;

    // Save current prompt to the mode we're leaving
    if (prev === "image") {
      imagePromptRef.current = prompt;
    } else {
      videoPromptRef.current = prompt;
    }

    // Restore from target mode's ref
    const restored = contentType === "image" ? imagePromptRef.current : videoPromptRef.current;
    setPrompt(restored);

    imageGen.reset();
    videoGen.reset();
    setSelectedImageIndex(0);
    setSelectedTemplateId(null);
  }, [contentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply template prompt from URL
  useEffect(() => {
    if (templatePrompt) {
      setPrompt(templatePrompt);
      toast.success(t("home.templateApplied"), {
        description: t("home.templateAppliedDesc"),
      });
    }
  }, [templatePrompt]);

  const handleNavigate = useCallback(
    (path: string, options?: Record<string, string | number | boolean>) => {
      if (options) {
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
        router.push(`${path}?${params.toString()}`);
      } else {
        router.push(path);
      }
    },
    [router]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt) return;

    if (!isAuthenticated) {
      toast.error(t("home.pleaseLoginFirst"));
      router.push("/login");
      return;
    }

    const allowed = await checkBeforeGenerate();
    if (!allowed) return;

    activeGen.generate(prompt, selectedTemplateId);
    setSelectedTemplateId(null);
  }, [prompt, isAuthenticated, checkBeforeGenerate, activeGen, selectedTemplateId, router]);

  const handleOptimizePrompt = useCallback(() => {
    imageGen.setEnhancePrompt((prev: boolean) => {
      const next = !prev;
      toast.success(next ? t("home.aiOptimizeEnabled") : t("home.aiOptimizeDisabled"));
      return next;
    });
  }, [imageGen]);

  const handleExampleClick = useCallback((templateId: string, displayName: string) => {
    setPrompt(displayName);
    setSelectedTemplateId(templateId);
    toast.info(t("home.templateSelected"));
  }, []);

  const handlePromptChange = useCallback(
    (value: string) => {
      setPrompt(value);
      if (selectedTemplateId) setSelectedTemplateId(null);
    },
    [selectedTemplateId]
  );

  const handleClearTemplate = useCallback(() => {
    setSelectedTemplateId(null);
    setPrompt("");
  }, []);

  // Lightbox slides for generated images
  const lightboxSlides: LightboxSlide[] = useMemo(
    () =>
      activeGen.generatedImages.map((img) => {
        const meta = [
          img.provider && img.model ? `${img.provider} · ${img.model}` : img.provider || img.model,
          img.duration ? `${img.duration.toFixed(1)}s` : null,
          img.width && img.height ? `${img.width}x${img.height}` : null,
          img.settings?.aspect_ratio,
        ]
          .filter(Boolean)
          .join(" · ");

        return {
          src: img.url,
          alt: prompt,
          title: prompt,
          description: meta || undefined,
        };
      }),
    [activeGen.generatedImages, prompt]
  );

  // Filtered recent items for current contentType
  const filteredRecent = useMemo(
    () => recentGenerations.filter((item) => inferContentType(item.filename) === contentType),
    [recentGenerations, contentType]
  );

  const recentLightboxSlides: LightboxSlide[] = useMemo(
    () =>
      filteredRecent.map((item) => {
        const isVideo = inferContentType(item.filename) === "video";
        const meta = [
          item.mode && getModeDisplayName(item.mode),
          item.provider,
          item.model,
          formatRelativeTime(item.created_at),
        ]
          .filter(Boolean)
          .join(" · ");

        if (isVideo) {
          return {
            type: "video" as const,
            poster: getImageUrl(item.thumbnail || item.url),
            width: 1920,
            height: 1080,
            sources: [{ src: getImageUrl(item.url), type: "video/mp4" }],
            title: item.prompt,
            description: meta,
            historyItem: item,
          };
        }

        return {
          src: getImageUrl(item.url),
          alt: item.prompt,
          title: item.prompt,
          description: meta,
          historyItem: item,
        };
      }),
    [filteredRecent]
  );

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      {/* Preview Section */}
      <PreviewPanel
        contentType={contentType}
        state={activeGen.state}
        progress={activeGen.progress}
        count={contentType === "image" ? imageGen.count : 1}
        generatedImages={activeGen.generatedImages}
        selectedImageIndex={selectedImageIndex}
        examplePrompts={prompts.examplePrompts}
        promptPage={prompts.promptPage}
        totalPages={prompts.totalPages}
        onPromptSelect={handleExampleClick}
        onPageChange={prompts.setPromptPage}
        onPauseChange={prompts.setPromptPaused}
        onImageSelect={setSelectedImageIndex}
        onDownload={() => {
          const link = document.createElement("a");
          link.href = activeGen.generatedImages[selectedImageIndex].url;
          link.download = `generated-${Date.now()}.png`;
          link.click();
        }}
        onEnlarge={() => setLightboxOpen(true)}
        onCancel={activeGen.cancel}
        showCancel={activeGen.isGenerating && (contentType === "video" || imageGen.count > 1)}
      />

      {/* Prompt Input */}
      <PromptInput
        prompt={prompt}
        onPromptChange={handlePromptChange}
        selectedTemplateId={selectedTemplateId}
        onClearTemplate={handleClearTemplate}
        enhancePrompt={imageGen.enhancePrompt}
        onToggleEnhance={handleOptimizePrompt}
        onGenerate={handleGenerate}
        onNavigateTemplates={() => handleNavigate("/templates")}
        isGenerating={activeGen.isGenerating}
      />

      {/* Parameters Row */}
      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        {contentType === "image" ? (
          <ImageParams
            qualityPreset={imageGen.qualityPreset}
            onPresetChange={imageGen.setQualityPreset}
            manualModel={imageGen.manualModel}
            onManualModelChange={imageGen.setManualModel}
            resolution={imageGen.resolution}
            onResolutionChange={imageGen.setResolution}
            aspectRatio={imageGen.aspectRatio}
            onAspectRatioChange={imageGen.setAspectRatio}
            count={imageGen.count}
            onCountChange={imageGen.setCount}
            searchGrounding={imageGen.searchGrounding}
            onSearchGroundingChange={imageGen.setSearchGrounding}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <VideoParams
            videoModel={videoGen.videoModel}
            onVideoModelChange={videoGen.setVideoModel}
            videoModelOptions={videoGen.videoModelOptions}
            videoResolution={videoGen.videoResolution}
            onVideoResolutionChange={videoGen.setVideoResolution}
            videoDuration={videoGen.videoDuration}
            onVideoDurationChange={videoGen.setVideoDuration}
            videoFrameRate={videoGen.videoFrameRate}
            onVideoFrameRateChange={videoGen.setVideoFrameRate}
            videoAspectRatio={videoGen.videoAspectRatio}
            onVideoAspectRatioChange={videoGen.setVideoAspectRatio}
            videoMotionStrength={videoGen.videoMotionStrength}
            onVideoMotionStrengthChange={videoGen.setVideoMotionStrength}
          />
        )}

        <AdvancedSettings
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          seed={imageGen.seed}
          onSeedChange={imageGen.setSeed}
          onRandomSeed={imageGen.generateRandomSeed}
          negativePrompt={imageGen.negativePrompt}
          onNegativePromptChange={imageGen.setNegativePrompt}
        />
      </div>

      {/* Mode Cards */}
      <ModeCards contentType={contentType} onNavigate={(path) => handleNavigate(path)} />

      {/* Recent Generations */}
      <RecentGenerations
        contentType={contentType}
        filteredRecent={filteredRecent}
        isLoading={isLoadingRecent}
        isAuthenticated={isAuthenticated}
        hasAnyRecent={recentGenerations.length > 0}
        lightboxSlides={recentLightboxSlides}
        onNavigateGallery={() => handleNavigate("/gallery", { type: contentType })}
      />

      {/* Lightbox for generated images */}
      <ImageLightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={selectedImageIndex}
      />
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-text-secondary">{t("common.loading")}</div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
