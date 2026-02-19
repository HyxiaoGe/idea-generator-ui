"use client";

import { Heart, Sparkles } from "lucide-react";
import { ProgressiveImage } from "@/components/progressive-image";
import type { TemplateListItem } from "@/lib/types";
import { getImageUrl, getTemplateDisplayName } from "@/lib/transforms";
import { useTranslation } from "@/lib/i18n";

const CATEGORY_ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  portrait: { width: 3, height: 4 },
  landscape: { width: 16, height: 9 },
  illustration: { width: 1, height: 1 },
  product: { width: 1, height: 1 },
  architecture: { width: 16, height: 9 },
  anime: { width: 3, height: 4 },
  fantasy: { width: 16, height: 9 },
  "graphic-design": { width: 1, height: 1 },
  food: { width: 1, height: 1 },
  abstract: { width: 1, height: 1 },
};

const DEFAULT_ASPECT_RATIO = { width: 4, height: 3 };

interface TemplateCardProps {
  template: TemplateListItem;
  lang?: string;
  isFavoritedTab?: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  width: number;
  height: number;
}

export function getTemplateDimensions(template: TemplateListItem) {
  return CATEGORY_ASPECT_RATIOS[template.category] || DEFAULT_ASPECT_RATIO;
}

export function TemplateCard({
  template,
  lang,
  isFavoritedTab,
  onClick,
  onToggleFavorite,
  width,
  height,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const imageUrl = getImageUrl(template.preview_image_url);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl"
      style={{ width, height }}
    >
      <ProgressiveImage
        src={imageUrl}
        alt={getTemplateDisplayName(template, lang)}
        className="h-full w-full"
        showLoader={false}
        loaderSize="sm"
      />

      {/* Hot badge */}
      {template.use_count > 10000 && (
        <div className="from-warning to-destructive absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-gradient-to-r px-2 py-0.5 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-[10px] font-medium text-white">{t("common.hot")}</span>
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(e);
        }}
        className="absolute top-2 right-2 rounded-lg bg-black/40 p-1.5 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/60 active:scale-90"
      >
        <Heart
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isFavoritedTab ? "fill-red-500 text-red-500" : "text-white"
          }`}
        />
      </button>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute right-0 bottom-0 left-0 p-3">
          <p className="mb-1 truncate text-sm font-medium text-white">
            {getTemplateDisplayName(template, lang)}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
              {t(`enums.templateCategory.${template.category}`)}
            </span>
            <span className="text-[10px] text-white/60">
              {t("templates.usageCount", { count: template.use_count.toLocaleString() })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
