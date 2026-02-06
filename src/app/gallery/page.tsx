"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  Trash2,
  RotateCw,
  Play,
  Heart,
  ChevronLeft,
  ChevronRight,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { BackButton } from "@/components/ui/back-button";
import { GalleryMasonrySkeleton } from "@/components/skeletons";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import { RequireAuth } from "@/lib/auth/require-auth";
import { getApiClient } from "@/lib/api-client";
import type { HistoryItem, PaginatedResponse } from "@/lib/types";
import { formatRelativeTime, getModeDisplayName, getImageUrl } from "@/lib/transforms";
import { toast } from "sonner";

function GalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const initialType = searchParams.get("type") as "all" | "image" | "video" | "favorite" | null;
  const selectedItemId = searchParams.get("id") || null;
  const autoPlayVideo = searchParams.get("autoplay") === "true";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [typeFilter, setTypeFilter] = useState(initialType || "all");
  const [dateFilter, setDateFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        setSelectedItem(null);
      } catch {
        toast.error("删除失败");
      }
    },
    [mutateHistory, mutateFavorites]
  );

  const toggleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPaused(false);
      } else {
        videoRef.current.pause();
        setIsVideoPaused(true);
      }
    }
  };

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

  // Keyboard navigation
  useEffect(() => {
    if (!selectedItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = filteredItems.findIndex((item) => item.id === selectedItem.id);

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setSelectedItem(filteredItems[currentIndex - 1]);
        setIsPlayingVideo(false);
      } else if (e.key === "ArrowRight" && currentIndex < filteredItems.length - 1) {
        setSelectedItem(filteredItems[currentIndex + 1]);
        setIsPlayingVideo(false);
      } else if (e.key === "Escape") {
        setSelectedItem(null);
        setIsPlayingVideo(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, filteredItems]);

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedItem) return;

    const currentIndex = filteredItems.findIndex((item) => item.id === selectedItem.id);

    if (direction === "prev" && currentIndex > 0) {
      const nextItem = filteredItems[currentIndex - 1];
      setSelectedItem(nextItem);
      setIsPlayingVideo(nextItem.type === "video");
    } else if (direction === "next" && currentIndex < filteredItems.length - 1) {
      const nextItem = filteredItems[currentIndex + 1];
      setSelectedItem(nextItem);
      setIsPlayingVideo(nextItem.type === "video");
    }
  };

  const getCurrentIndex = () => {
    if (!selectedItem) return { current: 0, total: 0 };
    const currentIndex = filteredItems.findIndex((item) => item.id === selectedItem.id);
    return { current: currentIndex + 1, total: filteredItems.length };
  };

  useEffect(() => {
    if (selectedItemId && rawItems.length > 0) {
      const item = rawItems.find((item) => item.id === selectedItemId);
      if (item) {
        setSelectedItem(item);
        if (item.type === "video" && autoPlayVideo) {
          setIsPlayingVideo(true);
        }
      }
    }
  }, [selectedItemId, rawItems, autoPlayVideo]);

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
          /* Grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group border-border bg-surface relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 will-change-transform hover:-translate-y-2 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
                onClick={() => {
                  setSelectedItem(item);
                  if (item.type === "video") {
                    setIsPlayingVideo(true);
                  }
                }}
                onMouseEnter={() => item.type === "video" && setHoveredVideo(item.id)}
                onMouseLeave={() => item.type === "video" && setHoveredVideo(null)}
              >
                <div className="relative aspect-square overflow-hidden">
                  {item.type === "video" ? (
                    <>
                      <img
                        src={getImageUrl(item.thumbnail || item.url)}
                        alt={item.prompt}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {hoveredVideo === item.id && item.url && (
                        <video
                          src={getImageUrl(item.url)}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    <img
                      src={getImageUrl(item.url)}
                      alt={item.prompt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {item.favorite && (
                    <div className="absolute top-3 left-3">
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </div>
                  )}

                  {/* Hover Action Bar */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 to-transparent p-4 transition-transform group-hover:translate-y-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 border-white/20 bg-black/40 text-white backdrop-blur-xl hover:bg-black/60 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
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
                          if (item.url) {
                            const link = document.createElement("a");
                            link.href = getImageUrl(item.url);
                            link.download = `generated-${item.id}.png`;
                            link.click();
                          }
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
                          router.push(`/?prompt=${encodeURIComponent(item.prompt)}`);
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
                          deleteItem(item.id);
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
                    <span className="text-text-secondary text-xs">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <Dialog
              open={!!selectedItem}
              onOpenChange={() => {
                setSelectedItem(null);
                setIsPlayingVideo(false);
              }}
            >
              <DialogContent className="border-border bg-surface max-h-[95vh] max-w-[95vw] overflow-hidden p-0 md:max-h-[90vh] md:max-w-[85vw]">
                <DialogTitle className="sr-only">作品详情</DialogTitle>
                <DialogDescription className="sr-only">
                  查看和管理你的作品详细信息
                </DialogDescription>
                <div className="grid md:grid-cols-[1.2fr,1fr]">
                  {/* Image/Video Preview */}
                  <div className="bg-background relative flex max-h-[50vh] min-h-[300px] items-center justify-center md:max-h-[600px] md:min-h-[400px]">
                    {selectedItem.type === "video" && isPlayingVideo ? (
                      <div className="relative h-full w-full">
                        <video
                          ref={videoRef}
                          src={getImageUrl(selectedItem.url)}
                          controls
                          autoPlay={autoPlayVideo}
                          className="h-full w-full object-contain"
                          onEnded={() => setIsPlayingVideo(false)}
                          onClick={toggleVideoPlayPause}
                        />

                        {isVideoPaused && (
                          <div
                            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20"
                            onClick={toggleVideoPlayPause}
                          >
                            <div className="rounded-full bg-black/60 p-4 backdrop-blur-xl transition-transform hover:scale-110">
                              <Play className="h-8 w-8 text-white md:h-12 md:w-12" fill="white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={getImageUrl(
                          selectedItem.type === "video"
                            ? selectedItem.thumbnail || selectedItem.url
                            : selectedItem.url
                        )}
                        alt={selectedItem.prompt}
                        className="h-full w-full object-contain"
                      />
                    )}

                    {/* Navigation Buttons */}
                    {!isPlayingVideo &&
                      (() => {
                        const currentIndex = filteredItems.findIndex(
                          (item) => item.id === selectedItem.id
                        );
                        const hasPrev = currentIndex > 0;
                        const hasNext = currentIndex < filteredItems.length - 1;

                        return (
                          <>
                            {hasPrev && (
                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateImage("prev");
                                }}
                                className="absolute top-1/2 left-2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-xl transition-all hover:bg-black/80 md:left-4 md:h-12 md:w-12"
                              >
                                <ChevronLeft className="h-5 w-5 text-white md:h-6 md:w-6" />
                              </Button>
                            )}

                            {hasNext && (
                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateImage("next");
                                }}
                                className="absolute top-1/2 right-2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-xl transition-all hover:bg-black/80 md:right-4 md:h-12 md:w-12"
                              >
                                <ChevronRight className="h-5 w-5 text-white md:h-6 md:w-6" />
                              </Button>
                            )}
                          </>
                        );
                      })()}

                    {/* Image Counter */}
                    {!isPlayingVideo && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 backdrop-blur-xl md:bottom-4 md:px-4 md:py-1.5">
                        <span className="text-xs text-white md:text-sm">
                          {getCurrentIndex().current} / {getCurrentIndex().total}
                        </span>
                      </div>
                    )}

                    {selectedItem.type === "video" && !isPlayingVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          onClick={() => setIsPlayingVideo(true)}
                          className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-xl hover:bg-white/30 md:h-16 md:w-16"
                        >
                          <Play className="h-6 w-6 text-white md:h-8 md:w-8" fill="white" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex max-h-[45vh] flex-col overflow-y-auto p-4 md:max-h-[90vh] md:p-6">
                    <div className="mb-3 md:mb-4">
                      <h3 className="text-text-primary text-lg font-semibold md:text-xl">详情</h3>
                    </div>

                    <div className="mb-4 flex-1 space-y-3 md:mb-6 md:space-y-4">
                      <div>
                        <label className="text-text-secondary mb-1 block text-sm">提示词</label>
                        <p className="border-border bg-surface-secondary text-text-primary rounded-lg border p-3 text-sm">
                          {selectedItem.prompt}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-text-secondary mb-1 block text-sm">类型</label>
                          <p className="text-text-primary text-sm capitalize">
                            {selectedItem.type === "image" ? "图片" : "视频"}
                          </p>
                        </div>
                        <div>
                          <label className="text-text-secondary mb-1 block text-sm">创建时间</label>
                          <p className="text-text-primary text-sm">
                            {formatRelativeTime(selectedItem.created_at)}
                          </p>
                        </div>
                        {selectedItem.provider && (
                          <div>
                            <label className="text-text-secondary mb-1 block text-sm">提供商</label>
                            <p className="text-text-primary text-sm">{selectedItem.provider}</p>
                          </div>
                        )}
                        {selectedItem.model && (
                          <div>
                            <label className="text-text-secondary mb-1 block text-sm">模型</label>
                            <p className="text-text-primary text-sm">{selectedItem.model}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className="text-text-secondary mb-1 block text-sm">模式</label>
                          <span className="text-text-primary inline-block rounded-md bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 px-3 py-1 text-sm">
                            {getModeDisplayName(selectedItem.mode)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                      <Button
                        className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
                        onClick={() => {
                          if (selectedItem.url) {
                            const link = document.createElement("a");
                            link.href = getImageUrl(selectedItem.url);
                            link.download = `generated-${selectedItem.id}.png`;
                            link.click();
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="border-border bg-surface-secondary hover:bg-surface rounded-xl"
                          onClick={() => {
                            router.push(`/?prompt=${encodeURIComponent(selectedItem.prompt)}`);
                            setSelectedItem(null);
                          }}
                        >
                          复用设置
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border bg-surface-secondary hover:bg-surface rounded-xl"
                          onClick={() => {
                            router.push(`/?prompt=${encodeURIComponent(selectedItem.prompt)}`);
                            setSelectedItem(null);
                          }}
                        >
                          <RotateCw className="mr-2 h-4 w-4" />
                          重新生成
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        onClick={() => deleteItem(selectedItem.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
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
