"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationResult } from "./generation-result";
import type { GeneratedImageInfo } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface GenerationOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: "generating" | "result";
  progress: number;
  count: number;
  generatedImages: GeneratedImageInfo[];
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
  onDownload: () => void;
  onEnlarge: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function GenerationOverlay({
  open,
  onOpenChange,
  state,
  progress,
  count,
  generatedImages,
  selectedImageIndex,
  onImageSelect,
  onDownload,
  onEnlarge,
  onCancel,
  showCancel,
}: GenerationOverlayProps) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 bg-background border-border fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border shadow-2xl duration-200 sm:max-w-4xl">
          <DialogPrimitive.Title className="sr-only">
            {state === "generating" ? t("common.generating") : t("common.generate")}
          </DialogPrimitive.Title>
          {/* Close button (only when result is shown) */}
          {state === "result" && (
            <DialogPrimitive.Close className="text-text-secondary hover:bg-surface-secondary hover:text-text-primary absolute top-4 right-4 z-10 rounded-lg p-1 opacity-70 transition-all hover:opacity-100 focus:outline-none">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{t("common.close")}</span>
            </DialogPrimitive.Close>
          )}

          <div className="relative">
            {/* Main preview area */}
            <div className="relative flex">
              <div
                className={`relative ${count > 1 && state === "result" ? "flex-1" : "w-full"} bg-background aspect-video`}
              >
                <GenerationResult
                  state={state}
                  progress={progress}
                  count={count}
                  generatedImages={generatedImages}
                  selectedImageIndex={selectedImageIndex}
                  onDownload={onDownload}
                  onEnlarge={onEnlarge}
                  onCancel={onCancel}
                  showCancel={showCancel}
                />
              </div>

              {/* Thumbnail sidebar for batch results */}
              {count > 1 && state === "result" && generatedImages.length > 1 && (
                <div className="border-border bg-background flex w-24 flex-col gap-2 border-l p-2">
                  {generatedImages
                    .filter((img) => img.url)
                    .map((img, index) => (
                      <button
                        key={index}
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
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Back to browsing button */}
            {state === "result" && (
              <div className="border-border flex justify-center border-t p-4">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  {t("common.continueCreating")}
                </Button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
