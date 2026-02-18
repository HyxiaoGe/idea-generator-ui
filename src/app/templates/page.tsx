"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, ThumbsUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import { getApiClient } from "@/lib/api-client";
import type {
  TemplateListItem,
  TemplateListResponse,
  TemplateCategoryInfo,
  GetPreferencesResponse,
} from "@/lib/types";
import { getImageUrl, getTemplateDisplayName } from "@/lib/transforms";

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Build API query params
  const templateParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page_size", "50");
    if (selectedCategory !== "全部" && selectedCategory !== "推荐" && selectedCategory !== "收藏") {
      params.set("category", selectedCategory);
    }
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [selectedCategory, debouncedSearch]);

  // Fetch templates from API
  const { data: apiTemplatesData, mutate: mutateTemplates } = useSWR<TemplateListResponse>(
    isAuthenticated && selectedCategory !== "收藏" && selectedCategory !== "推荐"
      ? `/templates?${templateParams}`
      : null
  );

  // Fetch categories dynamically
  const { data: categoriesData } = useSWR<TemplateCategoryInfo[]>(
    isAuthenticated ? "/templates/categories" : null
  );

  // Fetch favorites tab
  const { data: favoriteTemplates, mutate: mutateFavorites } = useSWR<TemplateListItem[]>(
    isAuthenticated && selectedCategory === "收藏" ? "/templates/favorites" : null
  );

  // Fetch recommended tab
  const { data: recommendedTemplates } = useSWR<TemplateListItem[]>(
    isAuthenticated && selectedCategory === "推荐" ? "/templates/recommended" : null
  );

  // Get language from user settings (cached by SWR)
  const { data: prefsData } = useSWR<GetPreferencesResponse>(
    isAuthenticated ? "/preferences" : null
  );
  const lang = prefsData?.preferences?.ui?.language;

  // Determine which templates to show
  const templates: TemplateListItem[] = useMemo(() => {
    if (selectedCategory === "收藏") {
      return favoriteTemplates || [];
    }
    if (selectedCategory === "推荐") {
      return recommendedTemplates || [];
    }
    if (apiTemplatesData?.items && apiTemplatesData.items.length > 0) {
      return apiTemplatesData.items;
    }
    return [];
  }, [selectedCategory, apiTemplatesData, favoriteTemplates, recommendedTemplates]);

  // Build category list from API
  const categories = useMemo(() => {
    const base = ["全部", "推荐", "收藏"];
    if (categoriesData && categoriesData.length > 0) {
      return [...base, ...categoriesData.map((c) => c.category)];
    }
    return base;
  }, [categoriesData]);

  // Client-side search filter (for when API search is not available)
  const filteredTemplates = useMemo(() => {
    if (debouncedSearch && !apiTemplatesData) {
      return templates.filter(
        (t) =>
          t.display_name_zh.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          t.display_name_en.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return templates;
  }, [templates, debouncedSearch, apiTemplatesData]);

  const handleToggleFavorite = useCallback(
    async (template: TemplateListItem) => {
      if (!isAuthenticated) {
        toast.error("请先登录");
        return;
      }
      try {
        const api = getApiClient();
        const result = await api.toggleTemplateFavorite(template.id);
        toast.success(result.action === "removed" ? "已取消收藏" : "已添加到收藏");
        mutateTemplates();
        mutateFavorites();
      } catch {
        toast.error("操作失败");
      }
    },
    [isAuthenticated, mutateTemplates, mutateFavorites]
  );

  const handleToggleLike = useCallback(
    async (template: TemplateListItem) => {
      if (!isAuthenticated) {
        toast.error("请先登录");
        return;
      }
      try {
        const api = getApiClient();
        await api.toggleTemplateLike(template.id);
        mutateTemplates();
      } catch {
        toast.error("操作失败");
      }
    },
    [isAuthenticated, mutateTemplates]
  );

  const handleUseTemplate = async (template: TemplateListItem) => {
    try {
      const api = getApiClient();
      // Fetch detail to get prompt_text, also records usage
      const detail = await api.useTemplate(template.id);
      const params = new URLSearchParams({ prompt: detail.prompt_text });
      router.push(`/?${params.toString()}`);
    } catch {
      // Fallback: navigate with display name as prompt
      const params = new URLSearchParams({ prompt: template.display_name_zh });
      router.push(`/?${params.toString()}`);
    }
  };

  // In "收藏" tab, all items are favorited
  const isFavoritedTab = selectedCategory === "收藏";

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => router.push("/")} />
          <div>
            <h1 className="text-text-primary text-2xl font-semibold">创作模板</h1>
            <p className="text-text-secondary text-sm">选择模板快速开始创作</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-surface focus:border-primary-start focus:ring-primary-start/20 w-full rounded-xl focus:ring-2 md:w-[240px]"
          />
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === category
                ? "from-primary-start to-primary-end shadow-primary-start/30 bg-gradient-to-r text-white shadow-lg"
                : "border-border bg-surface text-text-secondary hover:text-text-primary hover:border-primary-start border"
            }`}
          >
            {category === "推荐" && "🔥 "}
            {category === "收藏" && "❤️ "}
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 22 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group border-border bg-surface hover:border-primary-start hover:shadow-primary-start/30 overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl"
          >
            <div className="bg-background relative aspect-video overflow-hidden">
              <img
                src={getImageUrl(template.preview_image_url)}
                alt={getTemplateDisplayName(template, lang)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {template.use_count > 10000 && (
                <div className="from-warning to-destructive absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-gradient-to-r px-2 py-1 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">热门</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(template);
                }}
                className="absolute top-3 right-3 rounded-lg bg-black/40 p-2 backdrop-blur-sm transition-all hover:bg-black/60 active:scale-90"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    isFavoritedTab ? "fill-red-500 text-red-500" : "text-white"
                  }`}
                />
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 w-full rounded-xl bg-gradient-to-r"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    使用此模板
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-text-primary font-semibold">
                  {getTemplateDisplayName(template, lang)}
                </h3>
                <span className="bg-surface-secondary text-text-secondary rounded-md px-2 py-0.5 text-xs">
                  {template.category}
                </span>
              </div>
              <p className="text-text-secondary mb-3 line-clamp-2 text-sm">
                {lang === "en" ? template.display_name_zh : template.display_name_en}
              </p>
              <div className="text-text-secondary flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span>{template.use_count.toLocaleString()} 次使用</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(template);
                    }}
                    className="hover:text-text-primary flex items-center gap-1 transition-colors"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>{template.like_count}</span>
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="text-primary-start hover:text-primary-start/80 h-8"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  生成
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="border-border bg-surface flex min-h-[400px] flex-col items-center justify-center rounded-2xl border p-12">
          <div className="from-primary-start/20 to-primary-end/20 mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br text-5xl">
            📚
          </div>
          <h2 className="text-text-primary mb-2 text-xl font-semibold">未找到模板</h2>
          <p className="text-text-secondary text-center text-sm">试试搜索其他关键词</p>
        </div>
      )}
    </div>
  );
}
