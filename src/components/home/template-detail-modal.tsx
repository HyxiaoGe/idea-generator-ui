"use client";

import { Heart, ThumbsUp, Sparkles, LogIn } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModalSkeleton } from "@/components/skeletons";
import { ProgressiveImage } from "@/components/progressive-image";
import useSWR from "swr";
import type { TemplateDetailResponse } from "@/lib/types";
import { getImageUrl, getTemplateDisplayName, getTemplateDescription } from "@/lib/transforms";
import { useTranslation } from "@/lib/i18n";

interface TemplateDetailModalProps {
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang?: string;
  isAuthenticated: boolean;
  onGenerate: (templateId: string) => void;
}

export function TemplateDetailModal({
  templateId,
  open,
  onOpenChange,
  lang,
  isAuthenticated,
  onGenerate,
}: TemplateDetailModalProps) {
  const { t } = useTranslation();

  const { data: detail, isLoading } = useSWR<TemplateDetailResponse>(
    open && templateId ? `/templates/${templateId}` : null
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 border-border bg-background fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border shadow-2xl duration-200 sm:max-w-2xl">
          {/* Close button */}
          <DialogPrimitive.Close className="text-text-secondary hover:bg-surface-secondary hover:text-text-primary absolute top-4 right-4 z-10 rounded-lg p-1 opacity-70 transition-all hover:opacity-100 focus:outline-none">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">{t("common.close")}</span>
          </DialogPrimitive.Close>

          {isLoading || !detail ? (
            <div className="p-6">
              <DialogPrimitive.Title className="sr-only">
                {t("home.template")}
              </DialogPrimitive.Title>
              <DetailModalSkeleton />
            </div>
          ) : (
            <div className="max-h-[85vh] overflow-y-auto">
              {/* Preview image */}
              <div className="bg-background relative aspect-video">
                <ProgressiveImage
                  src={getImageUrl(detail.preview_image_url)}
                  alt={getTemplateDisplayName(detail, lang)}
                  aspectRatio="video"
                  className="h-full w-full"
                />
              </div>

              {/* Content */}
              <div className="space-y-4 p-6">
                {/* Title and description */}
                <div>
                  <DialogPrimitive.Title className="text-text-primary mb-1 text-xl font-semibold">
                    {getTemplateDisplayName(detail, lang)}
                  </DialogPrimitive.Title>
                  <p className="text-text-secondary text-sm">
                    {getTemplateDescription(detail, lang)}
                  </p>
                </div>

                {/* Category */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-surface-secondary text-text-secondary rounded-full px-2.5 py-0.5 text-xs">
                    {t(`enums.templateCategory.${detail.category}`)}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-secondary">
                    {t("templates.usageCount", { count: detail.use_count.toLocaleString() })}
                  </span>
                  <span className="text-text-secondary flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {detail.like_count}
                  </span>
                  <span className="text-text-secondary flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {detail.favorite_count}
                  </span>
                  <span className="bg-surface-secondary text-text-secondary rounded-md px-2 py-0.5 text-xs">
                    {t(`enums.templateDifficulty.${detail.difficulty}`)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => onGenerate(detail.id)}
                    disabled={!isAuthenticated}
                    className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 flex-1 rounded-xl bg-gradient-to-r disabled:opacity-50"
                  >
                    {isAuthenticated ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t("home.generateWithTemplate")}
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        {t("home.loginToGenerate")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
