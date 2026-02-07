"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";
import { GalleryMasonrySkeleton } from "@/components/skeletons";
import { GalleryCard } from "@/components/gallery-card";
import { ImageLightbox, type LightboxSlide } from "@/components/image-lightbox";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import { RequireAuth } from "@/lib/auth/require-auth";
import { getApiClient } from "@/lib/api-client";
import type { HistoryItem, PaginatedResponse } from "@/lib/types";
import {
  formatRelativeTime,
  getModeDisplayName,
  getImageUrl,
  getAspectRatioDimensions,
  inferContentType,
} from "@/lib/transforms";
import { toast } from "sonner";

interface GalleryPhoto {
  src: string;
  width: number;
  height: number;
  key: string;
  item: HistoryItem;
}

function GalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const initialType = searchParams.get("type") as "all" | "image" | "video" | "favorite" | null;
  const selectedItemId = searchParams.get("id") || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType || "all");
  const [dateFilter, setDateFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Build query params for API
  const queryParams = new URLSearchParams();
  queryParams.set("limit", "50");
  if (typeFilter !== "all" && typeFilter !== "favorite") {
    queryParams.set("type", typeFilter);
  }
  if (modeFilter !== "all") {
    queryParams.set("mode", modeFilter);
  }

  const { data: historyData, mutate: mutateHistory } = useSWR<PaginatedResponse<HistoryItem>>(
    isAuthenticated ? `/history?${queryParams.toString()}` : null
  );

  // Fetch favorites separately if needed
  const { data: favoritesData, mutate: mutateFavorites } = useSWR<HistoryItem[]>(
    isAuthenticated && typeFilter === "favorite" ? "/favorites" : null
  );

  const rawItems = typeFilter === "favorite" ? favoritesData || [] : historyData?.items || [];

  // Update filter when initialType changes
  useEffect(() => {
    if (initialType) {
      setTypeFilter(initialType);
    }
  }, [initialType]);

  const toggleFavorite = useCallback(
    async (item: HistoryItem) => {
      const api = getApiClient();
      try {
        if (item.favorite) {
          await api.removeFavorite(item.id);
          toast.info("已取消收藏");
        } else {
          await api.addFavorite(item.id);
          toast.success("已添加到收藏");
        }
        mutateHistory();
        mutateFavorites();
      } catch {
        toast.error("操作失败");
      }
    },
    [mutateHistory, mutateFavorites]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const api = getApiClient();
      try {
        await api.deleteHistoryItem(id);
        toast.success("已删除");
        mutateHistory();
        mutateFavorites();
      } catch {
        toast.error("删除失败");
      }
    },
    [mutateHistory, mutateFavorites]
  );

  // Client-side filtering for search and date
  const filteredItems = rawItems.filter((item) => {
    // Date filter
    if (dateFilter !== "all") {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (itemDate < today) return false;
      }
      if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < weekAgo) return false;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < monthAgo) return false;
      }
    }

    // Search filter
    if (searchQuery && !item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const hasItems = filteredItems.length > 0;

  // Build photos array for MasonryPhotoAlbum
  const photos: GalleryPhoto[] = useMemo(
    () =>
      filteredItems.map((item) => {
        const isVideo = inferContentType(item.filename) === "video";
        const { width, height } = getAspectRatioDimensions(item.settings?.aspect_ratio);
        return {
          src: getImageUrl(isVideo ? item.thumbnail || item.url : item.url),
          width,
          height,
          key: item.id,
          item,
        };
      }),
    [filteredItems]
  );

  // Build lightbox slides
  const lightboxSlides: LightboxSlide[] = useMemo(
    () =>
      filteredItems.map((item) => {
        const isVideo = inferContentType(item.filename) === "video";
        const meta = [
          item.mode && getModeDisplayName(item.mode),
          item.provider,
          item.model,
          formatRelativeTime(item.created_at),
        ]
          .filter(Boolean)
          .join(" · ");

        if (isVideo) {
          return {
            type: "video" as const,
            poster: getImageUrl(item.thumbnail || item.url),
            width: 1920,
            height: 1080,
            sources: [{ src: getImageUrl(item.url), type: "video/mp4" }],
            title: item.prompt,
            description: meta,
            historyItem: item,
          };
        }

        const { width: w, height: h } = getAspectRatioDimensions(item.settings?.aspect_ratio);
        return {
          src: getImageUrl(item.url),
          alt: item.prompt,
          width: w * 1024,
          height: h * 1024,
          title: item.prompt,
          description: meta,
          historyItem: item,
        };
      }),
    [filteredItems]
  );

  // Auto-open lightbox when URL has ?id=xxx, then clear the param
  useEffect(() => {
    if (selectedItemId && filteredItems.length > 0) {
      const idx = filteredItems.findIndex((item) => item.id === selectedItemId);
      if (idx >= 0) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
      // Remove id/autoplay from URL so refresh won't re-open
      const params = new URLSearchParams(searchParams.toString());
      params.delete("id");
      params.delete("autoplay");
      const qs = params.toString();
      router.replace(qs ? `/gallery?${qs}` : "/gallery", { scroll: false });
    }
    // Only run when selectedItemId changes (not on every filteredItems re-creation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:mb-8">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => router.push("/")} />
            <h1 className="text-text-primary text-xl font-semibold md:text-2xl">我的画廊</h1>
          </div>

          <div className="flex flex-col gap-3">
            {/* Filter Tabs */}
            <div className="bg-surface flex gap-2 overflow-x-auto rounded-xl p-1">
              {(["all", "image", "video", "favorite"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    typeFilter === filter
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {{ all: "全部", image: "图片", video: "视频", favorite: "收藏" }[filter]}
                </button>
              ))}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="border-border bg-surface w-full rounded-xl sm:w-[140px]">
                  <SelectValue placeholder="全部时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                </SelectContent>
              </Select>

              {/* Mode Filter */}
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="border-border bg-surface w-full rounded-xl sm:w-[140px]">
                  <SelectValue placeholder="所有模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有模式</SelectItem>
                  <SelectItem value="basic">基础</SelectItem>
                  <SelectItem value="chat">对话</SelectItem>
                  <SelectItem value="style">风格迁移</SelectItem>
                  <SelectItem value="blend">混合</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="text-text-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border bg-surface w-full rounded-xl pl-10 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {!hasItems ? (
          /* Empty State */
          <div className="border-border bg-surface flex min-h-[500px] flex-col items-center justify-center rounded-2xl border p-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-6xl">
              📁
            </div>
            <h2 className="text-text-primary mb-2 text-2xl font-semibold">还没有作品</h2>
            <p className="text-text-secondary mb-8 text-center text-sm">开始创作你的第一张图片吧</p>
            <Button
              onClick={() => router.push("/")}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 py-3 hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
            >
              去创作 →
            </Button>
            <p className="text-text-secondary mt-12 max-w-sm text-center text-xs">
              你在基础生成、对话微调等模式创作的图片都会保存在这里
            </p>
          </div>
        ) : (
          /* Masonry Grid */
          <MasonryPhotoAlbum
            photos={photos}
            columns={(containerWidth) => {
              if (containerWidth < 640) return 1;
              if (containerWidth < 768) return 2;
              if (containerWidth < 1024) return 3;
              return 4;
            }}
            spacing={16}
            onClick={({ index }) => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
            render={{
              photo: (_props, { photo, index, width, height }) => (
                <GalleryCard
                  key={photo.key || index}
                  item={(photo as GalleryPhoto).item}
                  width={width}
                  height={height}
                  onClick={() => {
                    const idx = photos.findIndex((p) => p.key === photo.key);
                    setLightboxIndex(idx >= 0 ? idx : 0);
                    setLightboxOpen(true);
                  }}
                  onFavorite={toggleFavorite}
                  onDelete={deleteItem}
                  onDownload={(item) => {
                    if (item.url) {
                      const link = document.createElement("a");
                      link.href = getImageUrl(item.url);
                      link.download = `generated-${item.id}.png`;
                      link.click();
                    }
                  }}
                  onReuse={(item) => {
                    router.push(`/?prompt=${encodeURIComponent(item.prompt)}`);
                  }}
                />
              ),
            }}
          />
        )}

        {/* Lightbox */}
        <ImageLightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          index={lightboxIndex}
          onFavorite={toggleFavorite}
          onDelete={(item) => {
            deleteItem(item.id);
            setLightboxOpen(false);
          }}
          onRegenerate={(item) => {
            router.push(`/?prompt=${encodeURIComponent(item.prompt)}`);
          }}
        />
      </div>
    </RequireAuth>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryMasonrySkeleton />}>
      <GalleryContent />
    </Suspense>
  );
}
