"use client";

import { useState } from "react";
import { Download, Heart, Play, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/progressive-image";
import type { HistoryItem } from "@/lib/types";
import {
  formatRelativeTime,
  getModeDisplayName,
  getImageUrl,
  inferContentType,
} from "@/lib/transforms";

interface GalleryCardProps {
  item: HistoryItem;
  width: number;
  height: number;
  onClick: () => void;
  onFavorite: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onDownload: (item: HistoryItem) => void;
  onReuse: (item: HistoryItem) => void;
}

export function GalleryCard({
  item,
  width,
  height,
  onClick,
  onFavorite,
  onDelete,
  onDownload,
  onReuse,
}: GalleryCardProps) {
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const isVideo = inferContentType(item.filename) === "video";

  return (
    <div
      className="group border-border bg-surface relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 will-change-transform hover:-translate-y-1 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
      style={{ width, backfaceVisibility: "hidden", transform: "translateZ(0)" }}
      onClick={onClick}
      onMouseEnter={() => isVideo && setIsVideoHovered(true)}
      onMouseLeave={() => isVideo && setIsVideoHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ height }}>
        {isVideo ? (
          <>
            <ProgressiveImage
              src={getImageUrl(item.thumbnail || item.url)}
              alt={item.prompt}
              className="h-full w-full"
              showLoader={false}
              loaderSize="sm"
            />
            {isVideoHovered && item.url && (
              <video
                src={getImageUrl(item.url)}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute top-3 right-3 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3 text-white" fill="white" />
                <span className="text-xs text-white">视频</span>
              </div>
            </div>
          </>
        ) : (
          <ProgressiveImage
            src={getImageUrl(item.url)}
            alt={item.prompt}
            className="h-full w-full"
            showLoader={false}
            loaderSize="sm"
          />
        )}

        {item.favorite && (
          <div className="absolute top-3 left-3">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          </div>
        )}

        {/* Hover Action Bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 to-transparent p-3 transition-transform group-hover:translate-y-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-black/60 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(item);
              }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${item.favorite ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                onReuse(item);
              }}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-red-500/80"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none p-3">
        <p className="text-text-primary mb-2 line-clamp-2 text-sm">{item.prompt}</p>
        <div className="flex items-center justify-between">
          <span className="bg-surface-secondary text-text-secondary rounded-md px-2 py-0.5 text-xs">
            {getModeDisplayName(item.mode)}
          </span>
          <span className="text-text-secondary text-xs">{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
