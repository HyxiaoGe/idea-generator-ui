"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import { GalleryMasonrySkeleton } from "@/components/skeletons";
import { TemplateCard, getTemplateDimensions } from "./template-card";
import type { TemplateListItem } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface TemplatePhoto {
  src: string;
  width: number;
  height: number;
  key: string;
  template: TemplateListItem;
}

interface TemplateMasonryGridProps {
  templates: TemplateListItem[];
  lang?: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isFavoritedTab: boolean;
  isAuthenticated: boolean;
  onLoadMore: () => void;
  onTemplateClick: (template: TemplateListItem) => void;
  onToggleFavorite: (template: TemplateListItem) => void;
}

export function TemplateMasonryGrid({
  templates,
  lang,
  isLoading,
  isLoadingMore,
  hasMore,
  isFavoritedTab,
  isAuthenticated,
  onLoadMore,
  onTemplateClick,
  onToggleFavorite,
}: TemplateMasonryGridProps) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading || !Array.isArray(templates)) {
    return <GalleryMasonrySkeleton />;
  }

  if (templates.length === 0) {
    return (
      <div className="border-border bg-surface flex min-h-[300px] flex-col items-center justify-center rounded-2xl border p-12">
        <div className="from-primary-start/20 to-primary-end/20 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl">
          {!isAuthenticated ? "🔒" : "📚"}
        </div>
        <h3 className="text-text-primary mb-1 text-lg font-semibold">
          {!isAuthenticated ? t("home.loginToGenerate") : t("templates.notFound")}
        </h3>
        <p className="text-text-secondary text-center text-sm">
          {!isAuthenticated ? t("auth.requireLoginDesc") : t("templates.notFoundDesc")}
        </p>
      </div>
    );
  }

  // Build photos array for masonry
  const photos: TemplatePhoto[] = templates.map((template) => {
    const dims = getTemplateDimensions(template);
    return {
      src: template.preview_image_url || "",
      width: dims.width,
      height: dims.height,
      key: template.id,
      template,
    };
  });

  return (
    <>
      <MasonryPhotoAlbum
        photos={photos}
        columns={(containerWidth) => {
          if (containerWidth < 640) return 2;
          if (containerWidth < 768) return 3;
          if (containerWidth < 1024) return 4;
          return 5;
        }}
        spacing={12}
        render={{
          photo: (_props, { photo, width, height }) => {
            const templatePhoto = photo as TemplatePhoto;
            return (
              <TemplateCard
                key={templatePhoto.key}
                template={templatePhoto.template}
                lang={lang}
                isFavoritedTab={isFavoritedTab}
                onClick={() => onTemplateClick(templatePhoto.template)}
                onToggleFavorite={() => onToggleFavorite(templatePhoto.template)}
                width={width}
                height={height}
              />
            );
          },
        }}
      />

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="mt-6 flex justify-center py-4">
          <Loader2 className="text-text-secondary h-6 w-6 animate-spin" />
        </div>
      )}
    </>
  );
}
