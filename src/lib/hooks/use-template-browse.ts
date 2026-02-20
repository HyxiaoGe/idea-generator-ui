"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { toast } from "sonner";
import { getApiClient } from "@/lib/api-client";
import type {
  TemplateListItem,
  TemplateListResponse,
  TemplateCategoryInfo,
  GetPreferencesResponse,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

const PAGE_SIZE = 30;

interface UseTemplateBrowseOptions {
  isAuthenticated: boolean;
  contentType: "image" | "video";
}

export function useTemplateBrowse({ isAuthenticated, contentType }: UseTemplateBrowseOptions) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
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

  // Fetch categories
  const { data: categoriesData } = useSWR<TemplateCategoryInfo[]>(
    isAuthenticated ? `/templates/categories?media_type=${contentType}` : null
  );

  // Get language from preferences
  const { data: prefsData } = useSWR<GetPreferencesResponse>(
    isAuthenticated ? "/preferences" : null
  );
  const lang = prefsData?.preferences?.ui?.language;

  // Build category list
  const categories = useMemo(() => {
    const base = ["all", "recommended", "favorites"];
    if (categoriesData && categoriesData.length > 0) {
      return [...base, ...categoriesData.map((c) => c.category)];
    }
    return base;
  }, [categoriesData]);

  // SWR Infinite for paginated templates
  const getTemplateKey = useCallback(
    (pageIndex: number, previousPageData: TemplateListResponse | null) => {
      // Don't fetch for special categories
      if (selectedCategory === "favorites" || selectedCategory === "recommended") return null;
      if (previousPageData && pageIndex * PAGE_SIZE >= previousPageData.total) return null;

      const params = new URLSearchParams();
      params.set("page_size", PAGE_SIZE.toString());
      params.set("page", (pageIndex + 1).toString());
      params.set("media_type", contentType);
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      return `/templates?${params.toString()}`;
    },
    [selectedCategory, debouncedSearch, contentType]
  );

  const {
    data: templatePages,
    mutate: mutateTemplates,
    size,
    setSize,
  } = useSWRInfinite<TemplateListResponse>(isAuthenticated ? getTemplateKey : () => null);

  // Compute isLoadingMore correctly: only true when the next page hasn't loaded yet,
  // NOT during revalidation of already-cached pages (which would block infinite scroll)
  const isLoadingMore = !templatePages
    ? isAuthenticated && selectedCategory !== "favorites" && selectedCategory !== "recommended"
    : size > 0 && typeof templatePages[size - 1] === "undefined";

  // Fetch favorites
  const { data: favoritesData, mutate: mutateFavorites } = useSWR<
    TemplateListResponse | TemplateListItem[]
  >(
    isAuthenticated && selectedCategory === "favorites"
      ? `/templates/favorites?media_type=${contentType}`
      : null
  );
  const favoriteTemplates = favoritesData
    ? Array.isArray(favoritesData)
      ? favoritesData
      : favoritesData.items
    : undefined;

  // Fetch recommended
  const { data: recommendedData } = useSWR<TemplateListResponse | TemplateListItem[]>(
    isAuthenticated && selectedCategory === "recommended"
      ? `/templates/recommended?media_type=${contentType}`
      : null
  );
  const recommendedTemplates = recommendedData
    ? Array.isArray(recommendedData)
      ? recommendedData
      : recommendedData.items
    : undefined;

  // Flatten paginated templates
  const paginatedItems = useMemo(() => {
    if (!templatePages) return [];
    return templatePages.flatMap((page) => page.items);
  }, [templatePages]);

  const hasMore = useMemo(() => {
    if (!templatePages || templatePages.length === 0) return false;
    const lastPage = templatePages[templatePages.length - 1];
    return size * PAGE_SIZE < lastPage.total;
  }, [templatePages, size]);

  // Determine which templates to show
  const templates: TemplateListItem[] = useMemo(() => {
    if (selectedCategory === "favorites") return favoriteTemplates || [];
    if (selectedCategory === "recommended") return recommendedTemplates || [];
    return paginatedItems;
  }, [selectedCategory, paginatedItems, favoriteTemplates, recommendedTemplates]);

  // Client-side search filter for non-paginated results
  const filteredTemplates = useMemo(() => {
    if (debouncedSearch && selectedCategory !== "all") {
      return templates.filter(
        (t) =>
          t.display_name_zh.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          t.display_name_en.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return templates;
  }, [templates, debouncedSearch, selectedCategory]);

  // Reset pagination and category when filters change
  useEffect(() => {
    setSize(1);
  }, [selectedCategory, debouncedSearch, contentType, setSize]);

  // Reset to "all" when contentType changes
  useEffect(() => {
    setSelectedCategory("all");
  }, [contentType]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setSize((s) => s + 1);
    }
  }, [hasMore, isLoadingMore, setSize]);

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (template: TemplateListItem) => {
      if (!isAuthenticated) {
        toast.error(t("home.pleaseLoginFirst"));
        return;
      }
      try {
        const api = getApiClient();
        const result = await api.toggleTemplateFavorite(template.id);
        toast.success(
          result.action === "removed"
            ? t("templates.removedFromFavorites")
            : t("templates.addedToFavorites")
        );
        mutateTemplates();
        mutateFavorites();
      } catch {
        toast.error(t("common.operationFailed"));
      }
    },
    [isAuthenticated, mutateTemplates, mutateFavorites, t]
  );

  // Toggle like
  const toggleLike = useCallback(
    async (template: TemplateListItem) => {
      if (!isAuthenticated) {
        toast.error(t("home.pleaseLoginFirst"));
        return;
      }
      try {
        const api = getApiClient();
        await api.toggleTemplateLike(template.id);
        mutateTemplates();
      } catch {
        toast.error(t("common.operationFailed"));
      }
    },
    [isAuthenticated, mutateTemplates, t]
  );

  const isLoading =
    (selectedCategory === "favorites" && !favoriteTemplates) ||
    (selectedCategory === "recommended" && !recommendedTemplates) ||
    (selectedCategory !== "favorites" &&
      selectedCategory !== "recommended" &&
      !templatePages &&
      isAuthenticated);

  return {
    templates: filteredTemplates,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    lang,
    toggleFavorite,
    toggleLike,
    mutateTemplates,
  };
}
