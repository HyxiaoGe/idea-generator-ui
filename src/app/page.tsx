"use client";

import { useState, useEffect, Suspense } from "react";
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

const recentGenerations = [
  {
    id: 1,
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1761223956832-a1e341babb92?w=200",
    prompt: "赛博朋克城市夜景",
  },
  {
    id: 2,
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1655435439159-92d407ae9ab5?w=200",
    prompt: "抽象渐变艺术",
  },
  {
    id: 3,
    type: "video" as const,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1672581437674-3186b17b405a?w=200",
    prompt: "未来科技世界动态场景",
  },
  {
    id: 4,
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1635046252882-910febb5c729?w=200",
    prompt: "数字艺术风景",
  },
  {
    id: 5,
    type: "video" as const,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=200",
    prompt: "梦幻森林视频",
  },
  {
    id: 6,
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1655892810227-c0cffe1d9717?w=200",
    prompt: "幻想角色肖像",
  },
];

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
  const [model, setModel] = useState("gemini");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredRecentVideo, setHoveredRecentVideo] = useState<number | null>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    setIsLoadingRecent(true);
    const timer = setTimeout(() => {
      setIsLoadingRecent(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [contentType]);

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

  const handleGenerate = () => {
    if (!prompt) return;

    setIsGenerating(true);
    setState("generating");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState("result");
          setIsGenerating(false);
          const images = Array(count)
            .fill(0)
            .map((_, i) => recentGenerations[i % recentGenerations.length].url);
          setGeneratedImages(images);
          setSelectedImageIndex(0);
          toast.success("生成完成！");
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

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

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      {/* Preview Section */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative flex">
          <div
            className={`relative ${count > 1 && state === "result" ? "flex-1" : "w-full"} aspect-video bg-background`}
          >
            {state === "empty" && (
              <div className="flex h-full flex-col items-center justify-center border-2 border-dashed border-border p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
                  {contentType === "image" ? (
                    <Sparkles className="h-8 w-8 text-[#7C3AED]" />
                  ) : (
                    <Film className="h-8 w-8 text-[#7C3AED]" />
                  )}
                </div>
                <p className="mb-6 text-center text-sm text-text-secondary">
                  生成结果将在此显示
                </p>

                <div className="grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                  {(contentType === "image" ? imagePrompts : videoPrompts).map(
                    (example, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleExampleClick(example.text)}
                        className="group flex items-center gap-3 rounded-full border border-border bg-surface-elevated px-4 py-3 text-left text-sm text-text-primary transition-all hover:border-[#7C3AED] hover:bg-surface hover:shadow-lg hover:shadow-[#7C3AED]/20"
                      >
                        <span className="text-xl">{example.emoji}</span>
                        <span className="flex-1">{example.text}</span>
                      </motion.button>
                    )
                  )}
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
                <h3 className="mb-2 text-xl font-semibold text-text-primary">
                  {count > 1
                    ? `生成中 ${Math.floor(progress / (100 / count))}/${count}...`
                    : "生成中"}
                </h3>
                <p className="mb-2 text-sm text-text-secondary">{progress}%</p>
                {count > 1 && progress > 0 && (
                  <p className="mb-6 text-xs text-text-secondary">
                    预计剩余 {Math.ceil((100 - progress) * 0.2)} 秒
                  </p>
                )}
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
                  <div className="absolute bottom-6 right-6 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white/10 backdrop-blur-xl hover:bg-white/20"
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
            <div className="flex w-24 flex-col gap-2 border-l border-border bg-background p-2">
              {generatedImages.map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-lg transition-all ${
                    selectedImageIndex === index
                      ? "ring-2 ring-[#7C3AED] shadow-lg shadow-[#7C3AED]/50"
                      : "ring-1 ring-border hover:ring-text-secondary"
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
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
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
            className="min-h-[120px] resize-none rounded-xl border-border bg-surface-elevated pr-32 text-text-primary placeholder:text-text-secondary focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleNavigate("/templates")}
              className="h-9 w-9 p-0 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              title="模板"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOptimizePrompt}
              disabled={!prompt}
              className="h-9 w-9 p-0 text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
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
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        {contentType === "image" ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <label className="mb-2 block text-xs text-text-secondary">模型</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="dalle">DALL-E 3</SelectItem>
                    <SelectItem value="midjourney">Midjourney</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-text-secondary">分辨率</label>
                <Select defaultValue="1k">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
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
                <label className="mb-2 block text-xs text-text-secondary">比例</label>
                <Select defaultValue="16:9">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-text-secondary">数量</label>
                <Select
                  value={count.toString()}
                  onValueChange={(v) => setCount(parseInt(v))}
                >
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20">
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
                    model === "gemini"
                      ? "border border-border bg-surface-elevated"
                      : "border border-dashed border-border bg-surface opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">🔍 搜索增强</span>
                    {model === "gemini" ? (
                      <span className="rounded-md bg-[#10B981]/20 px-2 py-0.5 text-xs text-[#10B981]">
                        Gemini专属
                      </span>
                    ) : (
                      <span className="text-xs text-text-secondary">
                        当前模型不支持
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={searchGrounding}
                    onCheckedChange={setSearchGrounding}
                    disabled={model !== "gemini"}
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
                <label className="mb-2 block text-xs text-text-secondary">模型</label>
                <Select defaultValue="runway">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="runway">Runway Gen-2</SelectItem>
                    <SelectItem value="pika">Pika Labs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-text-secondary">分辨率</label>
                <Select defaultValue="720p">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
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
                <label className="mb-2 block text-xs text-text-secondary">时长</label>
                <Select defaultValue="4">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
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
                <label className="mb-2 block text-xs text-text-secondary">帧率</label>
                <Select defaultValue="30">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
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
                <label className="mb-2 block text-xs text-text-secondary">比例</label>
                <Select defaultValue="16:9">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
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
                <label className="mb-2 block text-xs text-text-secondary">
                  运动强度
                </label>
                <Select defaultValue="medium">
                  <SelectTrigger className="h-9 rounded-xl border-border bg-surface-elevated text-sm">
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
          className="w-full text-text-secondary hover:text-text-primary"
        >
          <span className="mr-2 text-xs">⚙️ 高级</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                <div>
                  <label className="mb-2 block text-xs text-text-secondary">
                    随机种子
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="留空随机生成"
                      className="flex-1 rounded-xl border-border bg-surface-elevated focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateRandomSeed}
                      className="rounded-xl border-border bg-surface-elevated"
                    >
                      <Dices className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                    <span>引导强度</span>
                    <span className="text-text-primary">7.5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    defaultValue="7.5"
                    step="0.5"
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#7C3AED] [&::-webkit-slider-thumb]:to-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-text-secondary">
                    负面提示词
                  </label>
                  <Textarea
                    placeholder="例如：模糊, 低质量, 变形, 水印..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[60px] resize-none rounded-xl border-border bg-surface-elevated focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border"></div>
        <span className="text-sm text-text-secondary">进阶创作模式</span>
        <div className="h-px flex-1 bg-border"></div>
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
                className="group rounded-2xl border border-border bg-surface p-6 text-left transition-all duration-300 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-2xl transition-transform group-hover:scale-110">
                  💬
                </div>
                <h3 className="mb-1 font-semibold text-text-primary">对话微调</h3>
                <p className="text-xs text-text-secondary">通过对话优化画面</p>
                <div className="mt-3 overflow-hidden rounded-lg">
                  <img
                    src={recentGenerations[0].url}
                    alt="Chat preview"
                    className="w-full opacity-60 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/style")}
                className="group rounded-2xl border border-border bg-surface p-6 text-left transition-all duration-300 hover:border-[#10B981] hover:shadow-2xl hover:shadow-[#10B981]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#06B6D4]/20 text-2xl transition-transform group-hover:scale-110">
                  🎨
                </div>
                <h3 className="mb-1 font-semibold text-text-primary">风格迁移</h3>
                <p className="text-xs text-text-secondary">将风格应用到图片</p>
                <div className="mt-3 overflow-hidden rounded-lg">
                  <img
                    src={recentGenerations[1].url}
                    alt="Style preview"
                    className="w-full opacity-60 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => handleNavigate("/blend")}
                className="group rounded-2xl border border-border bg-surface p-6 text-left transition-all duration-300 hover:border-[#06B6D4] hover:shadow-2xl hover:shadow-[#06B6D4]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#10B981]/20 text-2xl transition-transform group-hover:scale-110">
                  🖼️
                </div>
                <h3 className="mb-1 font-semibold text-text-primary">图像混合</h3>
                <p className="text-xs text-text-secondary">多张图片智能融合</p>
                <div className="mt-3 overflow-hidden rounded-lg">
                  <img
                    src={recentGenerations[2].url}
                    alt="Blend preview"
                    className="w-full opacity-60 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
              </motion.button>

              <div className="relative cursor-not-allowed rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-left">
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 text-2xl opacity-50">
                  🎬
                </div>
                <h3 className="mb-1 font-semibold text-text-secondary">图生视频</h3>
                <p className="text-xs text-text-secondary">静态图片生成动态视频</p>
                <div className="mt-3 overflow-hidden rounded-lg bg-surface-elevated">
                  <div className="flex aspect-video items-center justify-center">
                    <Film className="h-8 w-8 text-border" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleNavigate("/image-to-video")}
                className="group relative overflow-hidden rounded-2xl border-2 bg-surface p-6 text-left transition-all"
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
                  <h3 className="mb-1 font-semibold text-text-primary">图生视频</h3>
                  <p className="text-xs text-text-secondary">上传图片生成动态视频</p>
                  <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-[#7C3AED]/30">
                    <img
                      src={recentGenerations[3].url}
                      alt="Video preview"
                      className="w-full opacity-70 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </div>
              </motion.button>

              <div className="relative cursor-not-allowed rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-left">
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-text-secondary/20 to-text-secondary/10 text-2xl opacity-50">
                  📝
                </div>
                <h3 className="mb-1 font-semibold text-text-secondary">脚本生成</h3>
                <p className="text-xs text-text-secondary">输入文字脚本自动生成视频</p>
                <div className="mt-3 overflow-hidden rounded-lg bg-surface-elevated">
                  <div className="flex aspect-video items-center justify-center">
                    <Film className="h-8 w-8 text-border" />
                  </div>
                </div>
              </div>

              <div className="relative cursor-not-allowed rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-left">
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-text-secondary/20 to-text-secondary/10 text-2xl opacity-50">
                  🔄
                </div>
                <h3 className="mb-1 font-semibold text-text-secondary">
                  视频风格迁移
                </h3>
                <p className="text-xs text-text-secondary">转换视频的艺术风格</p>
                <div className="mt-3 overflow-hidden rounded-lg bg-surface-elevated">
                  <div className="flex aspect-video items-center justify-center">
                    <Film className="h-8 w-8 text-border" />
                  </div>
                </div>
              </div>

              <div className="relative cursor-not-allowed rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-left">
                <div className="absolute right-3 top-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-text-secondary/20 to-text-secondary/10 text-2xl opacity-50">
                  ⏱️
                </div>
                <h3 className="mb-1 font-semibold text-text-secondary">视频延长</h3>
                <p className="text-xs text-text-secondary">延长已生成的视频时长</p>
                <div className="mt-3 overflow-hidden rounded-lg bg-surface-elevated">
                  <div className="flex aspect-video items-center justify-center">
                    <Film className="h-8 w-8 text-border" />
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Recent Generations */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">
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
                    setHoveredRecentVideo(item.id);
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
                {item.type === "video" && hoveredRecentVideo === item.id ? (
                  <video
                    src={item.url}
                    autoPlay
                    loop
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ProgressiveImage
                    src={
                      item.type === "video" && "thumbnail" in item
                        ? (item as { thumbnail: string }).thumbnail
                        : item.url
                    }
                    alt={item.prompt}
                    aspectRatio="square"
                    showLoader={false}
                    loaderSize="sm"
                  />
                )}

                {item.type === "video" && hoveredRecentVideo !== item.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-2 backdrop-blur-sm">
                      <Film className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
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
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="text-text-secondary">加载中...</div></div>}>
      <HomePageContent />
    </Suspense>
  );
}
