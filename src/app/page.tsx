"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Download,
  Maximize2,
  BookOpen,
  Wand2,
  Send,
  Film,
  Dices,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProgressiveImage } from "@/components/progressive-image";
import { RecentGenerationsSkeleton } from "@/components/skeletons";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuota } from "@/lib/quota/quota-context";
import { getApiClient } from "@/lib/api-client";
import type { HistoryItem, ProviderInfo, GenerateImageResponse, AspectRatio } from "@/lib/types";
import {
  getProviderAndModel,
  mapResolution,
  formatRelativeTime,
  getModeDisplayName,
  getImageUrl,
} from "@/lib/transforms";

const imagePrompts = [
  { emoji: "🐱", text: "一只橘猫坐在窗台上，赛博朋克风格" },
  { emoji: "🏙️", text: "未来科技感的悬浮城市，云层之上" },
  { emoji: "🏡", text: "森林中的小木屋，清晨薄雾" },
  { emoji: "🌌", text: "抽象艺术风格的星空，梵高笔触" },
];

const videoPrompts = [
  { emoji: "🌊", text: "海浪拍打沙滩，夕阳西下，慢镜头" },
  { emoji: "🚗", text: "城市街道穿梭，霓虹灯闪烁，第一人称视角" },
  { emoji: "🌸", text: "樱花飘落，微风吹拂，唯美氛围" },
  { emoji: "🔥", text: "篝火燃烧特写，火焰跳动，温馨场景" },
];

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { checkBeforeGenerate, refreshQuota } = useQuota();

  const contentType = (searchParams.get("type") as "image" | "video") || "image";
  const templatePrompt = searchParams.get("prompt") || "";

  const [prompt, setPrompt] = useState(templatePrompt);
  const [state, setState] = useState<"empty" | "generating" | "result">("empty");
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [count, setCount] = useState(1);
  const [seed, setSeed] = useState("");
  const [model, setModel] = useState("");
  const [resolution, setResolution] = useState("1k");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredRecentVideo, setHoveredRecentVideo] = useState<number | null>(null);

  // Video-specific state
  const [videoModel, setVideoModel] = useState("");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [videoDuration, setVideoDuration] = useState("4");
  const [videoFrameRate, setVideoFrameRate] = useState("30");
  const [videoAspectRatio, setVideoAspectRatio] = useState<AspectRatio>("16:9");
  const [videoMotionStrength, setVideoMotionStrength] = useState("medium");

  // Fetch image providers from API
  const { data: providersData } = useSWR<{ providers: ProviderInfo[] }>(
    isAuthenticated ? "/generate/providers" : null
  );
  const providers = providersData?.providers;

  // Fetch video providers from API
  const { data: videoProvidersData } = useSWR<{ providers: ProviderInfo[] }>(
    isAuthenticated ? "/video/providers" : null
  );
  const videoProviders = videoProvidersData?.providers;

  // Set default model from providers when they load
  useEffect(() => {
    if (providers?.length && !model) {
      const first = providers[0];
      setModel(`${first.name}:${first.models[0].id}`);
    }
  }, [providers, model]);

  useEffect(() => {
    if (videoProviders?.length && !videoModel) {
      const first = videoProviders[0];
      setVideoModel(`${first.name}:${first.models[0].id}`);
    }
  }, [videoProviders, videoModel]);

  // Fetch recent generations from API
  const { data: historyData, isLoading: isLoadingRecent } = useSWR<{
    items: HistoryItem[];
  }>(isAuthenticated ? `/history?limit=6` : null);

  const recentGenerations = historyData?.items || [];

  useEffect(() => {
    setState("empty");
    setProgress(0);
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setPrompt("");
  }, [contentType]);

  useEffect(() => {
    if (templatePrompt) {
      setPrompt(templatePrompt);
      toast.success("模板已应用", {
        description: "提示词已自动填充，可直接生成或修改",
      });
    }
  }, [templatePrompt]);

  const handleNavigate = (path: string, options?: Record<string, string | number | boolean>) => {
    if (options) {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
      router.push(`${path}?${params.toString()}`);
    } else {
      router.push(path);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt) return;

    if (!isAuthenticated) {
      toast.error("请先登录");
      router.push("/login");
      return;
    }

    // Check quota before generating
    const allowed = await checkBeforeGenerate();
    if (!allowed) return;

    setIsGenerating(true);
    setState("generating");
    setProgress(0);

    const api = getApiClient();
    const { provider, model: modelName } = getProviderAndModel(
      contentType === "video" ? videoModel : model
    );

    try {
      if (contentType === "video") {
        // Video generation
        const result = await api.generateVideo(
          {
            prompt,
            settings: {
              aspect_ratio: videoAspectRatio,
              resolution: mapResolution(videoResolution),
              safety_level: "moderate",
            },
          },
          provider,
          modelName
        );

        // Poll for video task progress
        const pollInterval = setInterval(async () => {
          try {
            const taskProgress = await api.getTaskProgress(result.task_id);
            const pct =
              taskProgress.total > 0
                ? Math.round((taskProgress.progress / taskProgress.total) * 100)
                : 0;
            setProgress(pct);

            if (taskProgress.status === "completed") {
              clearInterval(pollInterval);
              const urls = taskProgress.results
                .map((r) => getImageUrl(r.url || r.key))
                .filter(Boolean);
              setGeneratedImages(urls.length > 0 ? urls : []);
              setState("result");
              setIsGenerating(false);
              refreshQuota();
              toast.success("视频生成完成！");
            } else if (taskProgress.status === "failed") {
              clearInterval(pollInterval);
              setState("empty");
              setIsGenerating(false);
              toast.error("生成失败", {
                description: taskProgress.errors.join(", ") || "请重试",
              });
            }
          } catch {
            clearInterval(pollInterval);
            setState("empty");
            setIsGenerating(false);
            toast.error("获取进度失败");
          }
        }, 2000);

        return;
      }

      // Image generation
      if (count > 1) {
        // Batch generation
        const prompts = Array(count).fill(prompt);
        const result = await api.batchGenerate(
          {
            prompts,
            settings: {
              aspect_ratio: aspectRatio,
              resolution: mapResolution(resolution),
              safety_level: "moderate",
            },
          },
          provider,
          modelName
        );

        // Poll for batch progress
        const pollInterval = setInterval(async () => {
          try {
            const taskProgress = await api.getTaskProgress(result.task_id);
            const pct =
              taskProgress.total > 0
                ? Math.round((taskProgress.progress / taskProgress.total) * 100)
                : 0;
            setProgress(pct);

            if (taskProgress.status === "completed") {
              clearInterval(pollInterval);
              const urls = taskProgress.results
                .map((r) => getImageUrl(r.url || r.key))
                .filter(Boolean);
              setGeneratedImages(urls);
              setSelectedImageIndex(0);
              setState("result");
              setIsGenerating(false);
              refreshQuota();
              toast.success("生成完成！");
            } else if (taskProgress.status === "failed") {
              clearInterval(pollInterval);
              setState("empty");
              setIsGenerating(false);
              toast.error("生成失败", {
                description: taskProgress.errors.join(", ") || "请重试",
              });
            }
          } catch {
            clearInterval(pollInterval);
            setState("empty");
            setIsGenerating(false);
            toast.error("获取进度失败");
          }
        }, 2000);
      } else {
        // Single image generation
        setProgress(20);

        const generateFn = searchGrounding
          ? api.generateWithSearch.bind(api)
          : api.generateImage.bind(api);

        const result: GenerateImageResponse = await generateFn(
          {
            prompt,
            settings: {
              aspect_ratio: aspectRatio,
              resolution: mapResolution(resolution),
              safety_level: "moderate",
            },
          },
          provider,
          modelName
        );

        setProgress(100);
        const imageUrl = getImageUrl(result.image.url || result.image.key);
        setGeneratedImages([imageUrl]);
        setSelectedImageIndex(0);
        setState("result");
        setIsGenerating(false);
        refreshQuota();
        toast.success("生成完成！");
      }
    } catch (error) {
      setState("empty");
      setIsGenerating(false);
      setProgress(0);
      const message = error instanceof Error ? error.message : "生成失败，请重试";
      toast.error("生成失败", { description: message });
    }
  }, [
    prompt,
    isAuthenticated,
    checkBeforeGenerate,
    contentType,
    model,
    videoModel,
    count,
    searchGrounding,
    aspectRatio,
    resolution,
    videoAspectRatio,
    videoResolution,
    refreshQuota,
    router,
  ]);

  const handleOptimizePrompt = () => {
    toast.success("提示词已优化");
    setPrompt(prompt + "，高质量，超细节，专业摄影");
  };

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  const handleExampleClick = (text: string) => {
    setPrompt(text);
    toast.info("已填入示例提示词");
  };

  // Build model options from providers
  const imageModelOptions = (providers || []).flatMap((p) =>
    p.models.map((m) => ({
      value: `${p.name}:${m.id}`,
      label: `${p.display_name} ${m.name}`,
    }))
  );

  const videoModelOptions = (videoProviders || []).flatMap((p) =>
    p.models.map((m) => ({
      value: `${p.name}:${m.id}`,
      label: `${p.display_name} ${m.name}`,
    }))
  );

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      {/* Preview Section */}
      <div className="border-border bg-surface mb-6 overflow-hidden rounded-2xl border">
        <div className="relative flex">
          <div
            className={`relative ${count > 1 && state === "result" ? "flex-1" : "w-full"} bg-background aspect-video`}
          >
            {state === "empty" && (
              <div className="border-border flex h-full flex-col items-center justify-center border-2 border-dashed p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
                  {contentType === "image" ? (
                    <Sparkles className="h-8 w-8 text-[#7C3AED]" />
                  ) : (
                    <Film className="h-8 w-8 text-[#7C3AED]" />
                  )}
                </div>
                <p className="text-text-secondary mb-6 text-center text-sm">生成结果将在此显示</p>

                <div className="grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                  {(contentType === "image" ? imagePrompts : videoPrompts).map((example, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleExampleClick(example.text)}
                      className="group border-border bg-surface-elevated text-text-primary hover:bg-surface flex items-center gap-3 rounded-full border px-4 py-3 text-left text-sm transition-all hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20"
                    >
                      <span className="text-xl">{example.emoji}</span>
                      <span className="flex-1">{example.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {state === "generating" && (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <motion.div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-text-primary mb-2 text-xl font-semibold">
                  {count > 1
                    ? `生成中 ${Math.floor((progress / 100) * count)}/${count}...`
                    : "生成中"}
                </h3>
                <p className="text-text-secondary mb-2 text-sm">{progress}%</p>
                <div className="w-full max-w-md">
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            )}

            {state === "result" && generatedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative h-full"
              >
                <img
                  src={generatedImages[selectedImageIndex]}
                  alt="Generated"
                  className="h-full w-full object-cover"
                />

                {count > 1 && (
                  <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white">
                      {selectedImageIndex + 1}/{generatedImages.length}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute right-6 bottom-6 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = generatedImages[selectedImageIndex];
                        link.download = `generated-${Date.now()}.png`;
                        link.click();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
                      onClick={() => {
                        window.open(generatedImages[selectedImageIndex], "_blank");
                      }}
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      放大
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {count > 1 && state === "result" && generatedImages.length > 1 && (
            <div className="border-border bg-background flex w-24 flex-col gap-2 border-l p-2">
              {generatedImages.map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-lg transition-all ${
                    selectedImageIndex === index
                      ? "shadow-lg ring-2 shadow-[#7C3AED]/50 ring-[#7C3AED]"
                      : "ring-border hover:ring-text-secondary ring-1"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Result ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Input Section */}
      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        <div className="relative">
          <Textarea
            placeholder="描述你想要生成的画面..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
            className="border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary min-h-[120px] resize-none rounded-xl pr-32 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
          <div className="absolute right-3 bottom-3 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleNavigate("/templates")}
              className="text-text-secondary hover:bg-surface-elevated hover:text-text-primary h-9 w-9 p-0"
              title="模板"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOptimizePrompt}
              disabled={!prompt}
              className="text-text-secondary hover:bg-surface-elevated hover:text-text-primary h-9 w-9 p-0 disabled:opacity-50"
              title="AI优化"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="h-9 w-9 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] p-0 hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90 disabled:opacity-50"
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
        </div>
      </div>

      {/* Parameters Row */}
      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        {contentType === "image" ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <label className="text-text-secondary mb-2 block text-xs">模型</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">分辨率</label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512x512</SelectItem>
                    <SelectItem value="1k">1024x1024</SelectItem>
                    <SelectItem value="2k">2048x2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">比例</label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">数量</label>
                <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">×1</SelectItem>
                    <SelectItem value="2">×2</SelectItem>
                    <SelectItem value="4">×4</SelectItem>
                    <SelectItem value="8">×8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-end">
                <div
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ${
                    model === "gemini" || model.includes("google")
                      ? "border-border bg-surface-elevated border"
                      : "border-border bg-surface border border-dashed opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary text-sm">🔍 搜索增强</span>
                    {model === "gemini" || model.includes("google") ? (
                      <span className="rounded-md bg-[#10B981]/20 px-2 py-0.5 text-xs text-[#10B981]">
                        Gemini专属
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs">当前模型不支持</span>
                    )}
                  </div>
                  <Switch
                    checked={searchGrounding}
                    onCheckedChange={setSearchGrounding}
                    disabled={model !== "gemini" && !model.includes("google")}
                    className="data-[state=checked]:bg-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <label className="text-text-secondary mb-2 block text-xs">模型</label>
                <Select value={videoModel} onValueChange={setVideoModel}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoModelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">分辨率</label>
                <Select value={videoResolution} onValueChange={setVideoResolution}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">时长</label>
                <Select value={videoDuration} onValueChange={setVideoDuration}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2秒</SelectItem>
                    <SelectItem value="4">4秒</SelectItem>
                    <SelectItem value="6">6秒</SelectItem>
                    <SelectItem value="10">10秒</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">帧率</label>
                <Select value={videoFrameRate} onValueChange={setVideoFrameRate}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24fps</SelectItem>
                    <SelectItem value="30">30fps</SelectItem>
                    <SelectItem value="60">60fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">比例</label>
                <Select
                  value={videoAspectRatio}
                  onValueChange={(v) => setVideoAspectRatio(v as AspectRatio)}
                >
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">运动强度</label>
                <Select value={videoMotionStrength} onValueChange={setVideoMotionStrength}>
                  <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-text-secondary hover:text-text-primary w-full"
        >
          <span className="mr-2 text-xs">⚙️ 高级</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-border mt-4 space-y-4 border-t pt-4">
                <div>
                  <label className="text-text-secondary mb-2 block text-xs">随机种子</label>
                  <div className="flex gap-2">
                    <Input
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="留空随机生成"
                      className="border-border bg-surface-elevated flex-1 rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateRandomSeed}
                      className="border-border bg-surface-elevated rounded-xl"
                    >
                      <Dices className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 flex items-center justify-between text-xs">
                    <span>引导强度</span>
                    <span className="text-text-primary">7.5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    defaultValue="7.5"
                    step="0.5"
                    className="bg-border h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#7C3AED] [&::-webkit-slider-thumb]:to-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-xs">负面提示词</label>
                  <Textarea
                    placeholder="例如：模糊, 低质量, 变形, 水印..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="border-border bg-surface-elevated min-h-[60px] resize-none rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-border h-px flex-1"></div>
        <span className="text-text-secondary text-sm">进阶创作模式</span>
        <div className="bg-border h-px flex-1"></div>
      </div>

      {/* Advanced Mode Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={contentType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {contentType === "image" ? (
            <>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/chat")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-2xl transition-transform group-hover:scale-110">
                  💬
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">对话微调</h3>
                <p className="text-text-secondary text-xs">通过对话优化画面</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/style")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#10B981] hover:shadow-2xl hover:shadow-[#10B981]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#06B6D4]/20 text-2xl transition-transform group-hover:scale-110">
                  🎨
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">风格迁移</h3>
                <p className="text-text-secondary text-xs">将风格应用到图片</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/blend")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#06B6D4] hover:shadow-2xl hover:shadow-[#06B6D4]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#10B981]/20 text-2xl transition-transform group-hover:scale-110">
                  🖼️
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">图像混合</h3>
                <p className="text-text-secondary text-xs">多张图片智能融合</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/image-to-video")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#F59E0B] hover:shadow-2xl hover:shadow-[#F59E0B]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 text-2xl transition-transform group-hover:scale-110">
                  🎬
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">图生视频</h3>
                <p className="text-text-secondary text-xs">静态图片生成动态视频</p>
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleNavigate("/image-to-video")}
                className="group bg-surface relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all"
                style={{
                  borderImage: "linear-gradient(to right, #7C3AED, #2563EB) 1",
                  boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)",
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C3AED]/5 to-[#2563EB]/5"></div>

                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-2xl">
                      🎬
                    </div>
                    <span className="rounded-md bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-3 py-1 text-xs font-medium text-white shadow-lg shadow-[#7C3AED]/30">
                      推荐
                    </span>
                  </div>
                  <h3 className="text-text-primary mb-1 font-semibold">图生视频</h3>
                  <p className="text-text-secondary text-xs">上传图片生成动态视频</p>
                </div>
              </motion.button>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  📝
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">脚本生成</h3>
                <p className="text-text-secondary text-xs">输入文字脚本自动生成视频</p>
              </div>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  🔄
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">视频风格迁移</h3>
                <p className="text-text-secondary text-xs">转换视频的艺术风格</p>
              </div>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  ⏱️
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">视频延长</h3>
                <p className="text-text-secondary text-xs">延长已生成的视频时长</p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Recent Generations */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-text-primary font-semibold">
          最近生成{contentType === "video" ? "（视频）" : "（图片）"}
        </h2>
        <Button
          variant="ghost"
          onClick={() => handleNavigate("/gallery", { type: contentType })}
          className="text-[#10B981] hover:text-[#10B981]/80"
        >
          查看全部
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {isLoadingRecent ? (
          <RecentGenerationsSkeleton count={6} />
        ) : recentGenerations.length === 0 ? (
          <div className="flex w-full items-center justify-center py-8">
            <p className="text-text-secondary text-sm">
              {isAuthenticated ? "还没有生成记录" : "登录后查看生成历史"}
            </p>
          </div>
        ) : (
          recentGenerations
            .filter((item) => item.type === contentType)
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() =>
                  handleNavigate("/gallery", {
                    type: item.type,
                    id: item.id,
                    autoplay: item.type === "video",
                  })
                }
                onMouseEnter={() => {
                  if (item.type === "video") {
                    setHoveredRecentVideo(index);
                  }
                }}
                onMouseLeave={() => {
                  if (item.type === "video") {
                    setHoveredRecentVideo(null);
                  }
                }}
                className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl"
                style={{ width: "160px", height: "160px" }}
              >
                <ProgressiveImage
                  src={getImageUrl(item.thumbnail || item.url)}
                  alt={item.prompt}
                  aspectRatio="square"
                  showLoader={false}
                  loaderSize="sm"
                />

                {item.type === "video" && hoveredRecentVideo !== index && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-2 backdrop-blur-sm">
                      <Film className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute right-0 bottom-0 left-0 p-3">
                    <p className="line-clamp-2 text-xs text-white">{item.prompt}</p>
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-text-secondary">加载中...</div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
