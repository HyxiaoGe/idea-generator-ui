"use client";

import { useState } from "react";
import { ChevronRight, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ProgressiveImage } from "@/components/progressive-image";
import { RecentGenerationsSkeleton } from "@/components/skeletons";
import { ImageLightbox, type LightboxSlide } from "@/components/image-lightbox";
import type { HistoryItem } from "@/lib/types";
import { inferContentType, getImageUrl } from "@/lib/transforms";
import { useTranslation } from "@/lib/i18n";

interface RecentGenerationsProps {
  contentType: "image" | "video";
  filteredRecent: HistoryItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAnyRecent: boolean;
  lightboxSlides: LightboxSlide[];
  onNavigateGallery: () => void;
}

export function RecentGenerations({
  contentType,
  filteredRecent,
  isLoading,
  isAuthenticated,
  hasAnyRecent,
  lightboxSlides,
  onNavigateGallery,
}: RecentGenerationsProps) {
  const { t } = useTranslation();
  const [hoveredRecentVideo, setHoveredRecentVideo] = useState<number | null>(null);
  const [recentLightboxOpen, setRecentLightboxOpen] = useState(false);
  const [recentLightboxIndex, setRecentLightboxIndex] = useState(0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-text-primary font-semibold">
          {contentType === "video"
            ? t("recentGenerations.titleVideo")
            : t("recentGenerations.titleImage")}
        </h2>
        <Button
          variant="ghost"
          onClick={onNavigateGallery}
          className="text-accent hover:text-accent/80"
        >
          {t("common.viewAll")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {isLoading ? (
          <RecentGenerationsSkeleton count={6} />
        ) : !hasAnyRecent ? (
          <div className="flex w-full items-center justify-center py-8">
            <p className="text-text-secondary text-sm">
              {isAuthenticated
                ? t("recentGenerations.noRecords")
                : t("recentGenerations.loginToView")}
            </p>
          </div>
        ) : (
          filteredRecent.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.08,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={() => {
                setRecentLightboxIndex(index);
                setRecentLightboxOpen(true);
              }}
              onMouseEnter={() => {
                if (inferContentType(item.filename) === "video") {
                  setHoveredRecentVideo(index);
                }
              }}
              onMouseLeave={() => {
                if (inferContentType(item.filename) === "video") {
                  setHoveredRecentVideo(null);
                }
              }}
              className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl"
              style={{ width: "160px", height: "160px" }}
            >
              <ProgressiveImage
                src={getImageUrl(item.thumbnail || item.url)}
                alt={item.prompt}
                aspectRatio="square"
                showLoader={false}
                loaderSize="sm"
              />

              {inferContentType(item.filename) === "video" && hoveredRecentVideo !== index && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/60 p-2 backdrop-blur-sm">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute right-0 bottom-0 left-0 p-3">
                  <p className="line-clamp-2 text-xs text-white">{item.prompt}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ImageLightbox
        open={recentLightboxOpen}
        close={() => setRecentLightboxOpen(false)}
        slides={lightboxSlides}
        index={recentLightboxIndex}
      />
    </>
  );
}
