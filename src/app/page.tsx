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
  getTemplateDescription,
  inferContentType,
} from "@/lib/transforms";

// Hooks
import { useImageGeneration } from "@/lib/hooks/use-image-generation";
import { useVideoGeneration } from "@/lib/hooks/use-video-generation";
import { useTemplateBrowse } from "@/lib/hooks/use-template-browse";

// Components
import { SearchPromptBar } from "@/components/home/search-prompt-bar";
import { CollapsibleParams } from "@/components/home/collapsible-params";
import { ImageParams } from "@/components/home/image-params";
import { VideoParams } from "@/components/home/video-params";
import { AdvancedSettings } from "@/components/home/advanced-settings";
import { ModeChips } from "@/components/home/mode-chips";
import { TemplateMasonryGrid } from "@/components/home/template-masonry-grid";
import { TemplateDetailModal } from "@/components/home/template-detail-modal";
import { GenerationOverlay } from "@/components/home/generation-overlay";
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
  const [showParams, setShowParams] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<string | null>(null);
  const [generationOverlayOpen, setGenerationOverlayOpen] = useState(false);

  // History SWR (shared between hooks and recent panel)
  const {
    data: historyData,
    isLoading: isLoadingRecent,
    mutate: refreshHistory,
  } = useSWR<{ items: HistoryItem[] }>(
    isAuthenticated ? `/history?limit=6&media_type=${contentType}` : null
  );
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

  // Template browse hook
  const templateBrowse = useTemplateBrowse({ isAuthenticated, contentType });

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
  }, [templatePrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentTypeChange = useCallback(
    (type: "image" | "video") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", type);
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
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

    setGenerationOverlayOpen(true);
    activeGen.generate(prompt, selectedTemplateId);
    setSelectedTemplateId(null);
  }, [prompt, isAuthenticated, checkBeforeGenerate, activeGen, selectedTemplateId, router, t]);

  const handleOptimizePrompt = useCallback(() => {
    imageGen.setEnhancePrompt((prev: boolean) => {
      const next = !prev;
      toast.success(next ? t("home.aiOptimizeEnabled") : t("home.aiOptimizeDisabled"));
      return next;
    });
  }, [imageGen, t]);

  const handleTemplateClick = useCallback((template: { id: string }) => {
    setSelectedTemplateForDetail(template.id);
    setDetailModalOpen(true);
  }, []);

  const handleGenerateFromTemplate = useCallback(
    async (templateId: string) => {
      if (!isAuthenticated) {
        toast.error(t("home.pleaseLoginFirst"));
        router.push("/login");
        return;
      }

      const allowed = await checkBeforeGenerate();
      if (!allowed) return;

      // Fetch template detail to get prompt_text and description
      try {
        const { getApiClient } = await import("@/lib/api-client");
        const api = getApiClient();
        const detail = await api.useTemplate(templateId);

        // Show description in input, send prompt_text to backend
        const displayText = getTemplateDescription(detail, templateBrowse.lang);
        setDetailModalOpen(false);
        setPrompt(displayText);
        setSelectedTemplateId(templateId);
        setGenerationOverlayOpen(true);
        activeGen.generate(detail.prompt_text, templateId);
      } catch {
        toast.error(t("common.operationFailed"));
      }
    },
    [isAuthenticated, checkBeforeGenerate, activeGen, templateBrowse.lang, router, t]
  );

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

  // Open generation overlay when generation starts (e.g. from URL template prompt)
  useEffect(() => {
    if (activeGen.isGenerating && !generationOverlayOpen) {
      setGenerationOverlayOpen(true);
    }
  }, [activeGen.isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Recent items already filtered by contentType via API
  const filteredRecent = recentGenerations;

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
    <div className="mx-auto max-w-screen-xl px-6 py-6">
      {/* Search Prompt Bar */}
      <SearchPromptBar
        prompt={prompt}
        onPromptChange={handlePromptChange}
        selectedTemplateId={selectedTemplateId}
        onClearTemplate={handleClearTemplate}
        enhancePrompt={imageGen.enhancePrompt}
        onToggleEnhance={handleOptimizePrompt}
        onGenerate={handleGenerate}
        isGenerating={activeGen.isGenerating}
        showParams={showParams}
        onToggleParams={() => setShowParams(!showParams)}
        contentType={contentType}
        onContentTypeChange={handleContentTypeChange}
        categories={templateBrowse.categories}
        selectedCategory={templateBrowse.selectedCategory}
        onCategoryChange={templateBrowse.setSelectedCategory}
        searchQuery={templateBrowse.searchQuery}
        onSearchQueryChange={templateBrowse.setSearchQuery}
      />

      {/* Collapsible Parameters */}
      <CollapsibleParams open={showParams}>
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
      </CollapsibleParams>

      {/* Mode Chips */}
      <ModeChips contentType={contentType} />

      {/* Template Masonry Grid (main content) */}
      <TemplateMasonryGrid
        templates={templateBrowse.templates}
        lang={templateBrowse.lang}
        isLoading={templateBrowse.isLoading}
        isLoadingMore={templateBrowse.isLoadingMore}
        hasMore={templateBrowse.hasMore}
        isFavoritedTab={templateBrowse.selectedCategory === "favorites"}
        isAuthenticated={isAuthenticated}
        onLoadMore={templateBrowse.loadMore}
        onTemplateClick={handleTemplateClick}
        onToggleFavorite={templateBrowse.toggleFavorite}
      />

      {/* Recent Generations */}
      <div className="mt-8">
        <RecentGenerations
          contentType={contentType}
          filteredRecent={filteredRecent}
          isLoading={isLoadingRecent}
          isAuthenticated={isAuthenticated}
          hasAnyRecent={recentGenerations.length > 0}
          lightboxSlides={recentLightboxSlides}
          onNavigateGallery={() => router.push(`/gallery?type=${contentType}`)}
        />
      </div>

      {/* Template Detail Modal */}
      <TemplateDetailModal
        templateId={selectedTemplateForDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        lang={templateBrowse.lang}
        isAuthenticated={isAuthenticated}
        onGenerate={handleGenerateFromTemplate}
      />

      {/* Generation Overlay */}
      <GenerationOverlay
        open={generationOverlayOpen}
        onOpenChange={setGenerationOverlayOpen}
        state={activeGen.state as "generating" | "result"}
        progress={activeGen.progress}
        count={contentType === "image" ? imageGen.count : 1}
        generatedImages={activeGen.generatedImages}
        selectedImageIndex={selectedImageIndex}
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
