"use client";

import { Sparkles, Download, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";
import type { GeneratedImageInfo } from "@/lib/types";

interface GenerationResultProps {
  state: "generating" | "result";
  progress: number;
  count: number;
  generatedImages: GeneratedImageInfo[];
  selectedImageIndex: number;
  onDownload: () => void;
  onEnlarge: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function GenerationResult({
  state,
  progress,
  count,
  generatedImages,
  selectedImageIndex,
  onDownload,
  onEnlarge,
  onCancel,
  showCancel,
}: GenerationResultProps) {
  if (state === "generating") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <motion.div
          className="from-primary-start to-primary-end mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        <h3 className="text-text-primary mb-2 text-xl font-semibold">
          {count > 1 ? `生成中 ${Math.floor((progress / 100) * count)}/${count}...` : "生成中"}
        </h3>
        <p className="text-text-secondary mb-2 text-sm">{progress}%</p>
        <div className="w-full max-w-md">
          <Progress value={progress} className="h-2" />
        </div>
        {onCancel && showCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-text-secondary hover:text-destructive mt-4"
          >
            <X className="mr-1 h-4 w-4" />
            取消生成
          </Button>
        )}
      </div>
    );
  }

  const img = generatedImages[selectedImageIndex];
  if (!img?.url) return null;
  const hasMetadata = img.provider || img.model || img.duration || img.width;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative h-full">
      <img src={img.url} alt="Generated" className="h-full w-full object-cover" />

      {count > 1 && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            {selectedImageIndex + 1}/{generatedImages.length}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        {hasMetadata && (
          <div className="absolute bottom-6 left-6 flex flex-col gap-1.5">
            {(img.model_display_name || img.provider || img.model) && (
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white backdrop-blur">
                  {img.model_display_name
                    ? `由 ${img.model_display_name} 生成`
                    : [img.provider, img.model].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {img.duration != null && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white backdrop-blur">
                  {img.duration.toFixed(1)}s
                </span>
              )}
              {img.width && img.height && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white backdrop-blur">
                  {img.width}x{img.height}
                </span>
              )}
              {img.settings?.aspect_ratio && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white backdrop-blur">
                  {img.settings.aspect_ratio}
                </span>
              )}
            </div>
            {img.processed_prompt && (
              <p className="max-w-sm truncate text-xs text-white/70">{img.processed_prompt}</p>
            )}
          </div>
        )}
        <div className="absolute right-6 bottom-6 flex gap-2">
          <Button
            size="sm"
            className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
            onClick={onDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            下载
          </Button>
          <Button
            size="sm"
            className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
            onClick={onEnlarge}
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            放大
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
