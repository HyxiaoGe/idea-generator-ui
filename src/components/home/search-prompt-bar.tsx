"use client";

import { Sparkles, Wand2, Send, SlidersHorizontal, ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

interface SearchPromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedTemplateId: string | null;
  onClearTemplate: () => void;
  enhancePrompt: boolean;
  onToggleEnhance: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  showParams: boolean;
  onToggleParams: () => void;
  contentType: "image" | "video";
  onContentTypeChange: (type: "image" | "video") => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const categoryDisplayName = (cat: string, t: (key: string) => string) => {
  const map: Record<string, string> = {
    all: t("templates.allCategory"),
    recommended: t("templates.recommendedCategory"),
    favorites: t("templates.favoritesCategory"),
  };
  return map[cat] || t(`enums.templateCategory.${cat}`);
};

export function SearchPromptBar({
  prompt,
  onPromptChange,
  selectedTemplateId,
  onClearTemplate,
  enhancePrompt,
  onToggleEnhance,
  onGenerate,
  isGenerating,
  showParams,
  onToggleParams,
  contentType,
  onContentTypeChange,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery: _searchQuery,
  onSearchQueryChange: _onSearchQueryChange,
}: SearchPromptBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-3">
      {/* Prompt input bar */}
      <div className="border-border bg-surface flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition-all focus-within:border-[var(--primary-start)] focus-within:shadow-md">
        <Sparkles className="text-text-secondary h-5 w-5 flex-shrink-0" />
        {selectedTemplateId && (
          <span className="bg-primary-start/20 text-primary-start inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs">
            {t("home.template")}
            <button
              onClick={onClearTemplate}
              aria-label={t("home.clearTemplate")}
              className="hover:text-primary-start/70"
            >
              ✕
            </button>
          </span>
        )}
        <Input
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onGenerate();
            }
          }}
          placeholder={t("home.searchPlaceholder")}
          className="h-8 min-w-0 flex-1 border-none bg-transparent shadow-none placeholder:text-[var(--text-secondary)] focus-visible:ring-0"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleEnhance}
          className={`h-8 w-8 flex-shrink-0 rounded-full p-0 ${
            enhancePrompt
              ? "bg-primary-start/20 text-primary-start hover:bg-primary-start/30"
              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          }`}
          title={enhancePrompt ? t("home.aiOptimizeOn") : t("home.aiOptimize")}
        >
          <Wand2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleParams}
          className={`h-8 w-8 flex-shrink-0 rounded-full p-0 ${
            showParams
              ? "bg-primary-start/20 text-primary-start hover:bg-primary-start/30"
              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          }`}
          title={showParams ? t("home.hideParams") : t("home.showParams")}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={!prompt || isGenerating}
          className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-r p-0 disabled:opacity-50"
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content type tabs + category filters */}
      <div className="flex items-center gap-3 overflow-x-auto">
        {/* Image / Video tabs */}
        <div className="bg-surface flex flex-shrink-0 items-center gap-0.5 rounded-lg p-0.5">
          <button
            onClick={() => onContentTypeChange("image")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              contentType === "image"
                ? "from-primary-start to-primary-end bg-gradient-to-r text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {t("nav.imageGeneration")}
          </button>
          <button
            onClick={() => onContentTypeChange("video")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              contentType === "video"
                ? "from-primary-start to-primary-end bg-gradient-to-r text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            {t("nav.videoGeneration")}
          </button>
        </div>

        {/* Divider */}
        <div className="bg-border h-5 w-px flex-shrink-0" />

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedCategory === category
                  ? "from-primary-start to-primary-end bg-gradient-to-r text-white"
                  : "border-border bg-surface text-text-secondary hover:text-text-primary border"
              }`}
            >
              {category === "recommended" && "🔥 "}
              {category === "favorites" && "❤️ "}
              {categoryDisplayName(category, t)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
