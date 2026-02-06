"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import { getApiClient } from "@/lib/api-client";
import type { Template } from "@/lib/types";
import { getImageUrl } from "@/lib/transforms";

// Fallback templates for when not authenticated or API unavailable
const fallbackTemplates: Template[] = [
  {
    id: "1",
    title: "赛博朋克城市",
    prompt: "未来主义的赛博朋克城市，霓虹灯光，雨夜街道，高耸的摩天大楼，飞行汽车",
    image: "https://images.unsplash.com/photo-1761223956832-a1e341babb92?w=400",
    category: "科幻",
    trending: true,
    uses: 12453,
  },
  {
    id: "2",
    title: "抽象渐变",
    prompt: "流动的色彩，抽象渐变艺术，柔和的过渡，梦幻般的氛围",
    image: "https://images.unsplash.com/photo-1655435439159-92d407ae9ab5?w=400",
    category: "抽象",
    trending: false,
    uses: 8932,
  },
  {
    id: "3",
    title: "魔法森林",
    prompt: "神秘的魔法森林，发光的蘑菇，仙女，薄雾弥漫，梦幻色彩",
    image: "https://images.unsplash.com/photo-1672581437674-3186b17b405a?w=400",
    category: "奇幻",
    trending: true,
    uses: 15672,
  },
  {
    id: "4",
    title: "日式庭院",
    prompt: "传统日式庭院，枯山水，樱花盛开，木质建筑，宁静氛围",
    image: "https://images.unsplash.com/photo-1635046252882-910febb5c729?w=400",
    category: "建筑",
    trending: false,
    uses: 6234,
  },
  {
    id: "5",
    title: "太空探索",
    prompt: "宇宙飞船，星云，遥远的行星，太空探险，科幻风格",
    image: "https://images.unsplash.com/photo-1655892810227-c0cffe1d9717?w=400",
    category: "科幻",
    trending: true,
    uses: 18234,
  },
  {
    id: "6",
    title: "水彩花卉",
    prompt: "水彩画风格的花卉，柔和色彩，艺术插画，清新自然",
    image: "https://images.unsplash.com/photo-1655435439159-92d407ae9ab5?w=400",
    category: "艺术",
    trending: false,
    uses: 9456,
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());

  // Fetch templates from API
  const { data: apiTemplates } = useSWR<Template[]>(isAuthenticated ? "/templates" : null);

  const templates = apiTemplates && apiTemplates.length > 0 ? apiTemplates : fallbackTemplates;

  // Build category list from templates
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ["全部", "推荐", "收藏", ...Array.from(cats)];
  }, [templates]);

  const toggleFavorite = (id: string) => {
    setLocalFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("已取消收藏");
      } else {
        next.add(id);
        toast.success("已添加到收藏", { description: "可在「收藏」分类中查看" });
      }
      return next;
    });
  };

  const handleUseTemplate = async (template: Template) => {
    // Record template usage in backend
    if (isAuthenticated) {
      try {
        const api = getApiClient();
        await api.useTemplate(template.id);
      } catch {
        // Non-critical, continue navigation
      }
    }

    const params = new URLSearchParams({ prompt: template.prompt });
    router.push(`/?${params.toString()}`);
  };

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === "推荐") return t.trending;
    if (selectedCategory === "收藏") return localFavorites.has(t.id);
    if (selectedCategory !== "全部" && t.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
            className="border-border bg-surface w-full rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 md:w-[240px]"
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
                ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-[#7C3AED]/30"
                : "border-border bg-surface text-text-secondary hover:text-text-primary border hover:border-[#7C3AED]"
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
            className="group border-border bg-surface overflow-hidden rounded-2xl border transition-all duration-300 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
          >
            <div className="bg-background relative aspect-video overflow-hidden">
              <img
                src={getImageUrl(template.image)}
                alt={template.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {template.trending && (
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#EF4444] px-2 py-1 backdrop-blur-sm">
                  <TrendingUp className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">热门</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(template.id);
                }}
                className="absolute top-3 right-3 rounded-lg bg-black/40 p-2 backdrop-blur-sm transition-all hover:bg-black/60 active:scale-90"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    localFavorites.has(template.id) ? "fill-red-500 text-red-500" : "text-white"
                  }`}
                />
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    使用此模板
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-text-primary font-semibold">{template.title}</h3>
                <span className="bg-surface-secondary text-text-secondary rounded-md px-2 py-0.5 text-xs">
                  {template.category}
                </span>
              </div>
              <p className="text-text-secondary mb-3 line-clamp-2 text-sm">{template.prompt}</p>
              <div className="text-text-secondary flex items-center justify-between text-xs">
                <span>{template.uses.toLocaleString()} 次使用</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="h-8 text-[#7C3AED] hover:text-[#7C3AED]/80"
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
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-5xl">
            📚
          </div>
          <h2 className="text-text-primary mb-2 text-xl font-semibold">未找到模板</h2>
          <p className="text-text-secondary text-center text-sm">试试搜索其他关键词</p>
        </div>
      )}
    </div>
  );
}
