"use client";

import { motion } from "motion/react";
import { EmptyStatePrompts } from "./empty-state-prompts";
import { GenerationResult } from "./generation-result";
import type { GeneratedImageInfo } from "@/lib/types";
import type { ExamplePrompt } from "@/lib/hooks/use-example-prompts";

interface PreviewPanelProps {
  contentType: "image" | "video";
  state: "empty" | "generating" | "result";
  progress: number;
  count: number;
  generatedImages: GeneratedImageInfo[];
  selectedImageIndex: number;
  examplePrompts: ExamplePrompt[];
  promptPage: number;
  totalPages: number;
  onPromptSelect: (templateId: string, text: string) => void;
  onPageChange: (page: number) => void;
  onPauseChange: (paused: boolean) => void;
  onImageSelect: (index: number) => void;
  onDownload: () => void;
  onEnlarge: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function PreviewPanel({
  contentType,
  state,
  progress,
  count,
  generatedImages,
  selectedImageIndex,
  examplePrompts,
  promptPage,
  totalPages,
  onPromptSelect,
  onPageChange,
  onPauseChange,
  onImageSelect,
  onDownload,
  onEnlarge,
  onCancel,
  showCancel,
}: PreviewPanelProps) {
  return (
    <div className="border-border bg-surface mb-6 overflow-hidden rounded-2xl border">
      <div className="relative flex">
        <div
          className={`relative ${count > 1 && state === "result" ? "flex-1" : "w-full"} bg-background aspect-video`}
        >
          {state === "empty" && (
            <EmptyStatePrompts
              contentType={contentType}
              examplePrompts={examplePrompts}
              promptPage={promptPage}
              totalPages={totalPages}
              onPromptSelect={onPromptSelect}
              onPageChange={onPageChange}
              onPauseChange={onPauseChange}
            />
          )}

          {(state === "generating" || (state === "result" && generatedImages.length > 0)) && (
            <GenerationResult
              state={state as "generating" | "result"}
              progress={progress}
              count={count}
              generatedImages={generatedImages}
              selectedImageIndex={selectedImageIndex}
              onDownload={onDownload}
              onEnlarge={onEnlarge}
              onCancel={onCancel}
              showCancel={showCancel}
            />
          )}
        </div>

        {count > 1 && state === "result" && generatedImages.length > 1 && (
          <div className="border-border bg-background flex w-24 flex-col gap-2 border-l p-2">
            {generatedImages
              .filter((img) => img.url)
              .map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onImageSelect(index)}
                  className={`overflow-hidden rounded-lg transition-all ${
                    selectedImageIndex === index
                      ? "shadow-primary-start/50 ring-primary-start shadow-lg ring-2"
                      : "ring-border hover:ring-text-secondary ring-1"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Result ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </motion.button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
