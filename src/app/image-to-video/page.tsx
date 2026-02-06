"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";
import { RequireAuth } from "@/lib/auth/require-auth";
import { useAuth } from "@/lib/auth/auth-context";
import { getApiClient } from "@/lib/api-client";
import { getProviderAndModel, getImageUrl } from "@/lib/transforms";
import { useQuota } from "@/lib/quota/quota-context";
import type { ProviderInfo } from "@/lib/types";

export default function ImageToVideoPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { checkBeforeGenerate, refreshQuota } = useQuota();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [motionDescription, setMotionDescription] = useState("");
  const [duration, setDuration] = useState("4");
  const [motionStrength, setMotionStrength] = useState("medium");
  const [cameraMotion, setCameraMotion] = useState("none");
  const [model, setModel] = useState("");

  // Fetch video providers from API
  const { data: videoProvidersData } = useSWR<{ providers: ProviderInfo[] }>(
    isAuthenticated ? "/video/providers" : null
  );
  const videoProviders = videoProvidersData?.providers;

  const videoModelOptions = (videoProviders || []).flatMap((p) =>
    p.models.map((m) => ({
      value: `${p.name}:${m.id}`,
      label: `${p.display_name} ${m.name}`,
    }))
  );

  useEffect(() => {
    if (videoProviders?.length && !model) {
      const first = videoProviders[0];
      setModel(`${first.name}:${first.models[0].id}`);
    }
  }, [videoProviders, model]);
  const [state, setState] = useState<"idle" | "generating" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        setFileName(file.name);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileSize(`${sizeMB} MB`);
        toast.success("图片上传成功");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) {
      toast.error("请先上传图片");
      return;
    }

    const allowed = await checkBeforeGenerate();
    if (!allowed) return;

    setState("generating");
    setProgress(0);

    try {
      const api = getApiClient();
      const { provider, model: modelName } = getProviderAndModel(model);

      const prompt = motionDescription || "Generate a video from this image with smooth motion";

      const result = await api.generateVideo(
        {
          prompt,
          settings: {
            aspect_ratio: "16:9",
            resolution: "1K",
            safety_level: "moderate",
          },
        },
        provider,
        modelName
      );

      // Poll for progress
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
            const videoUrl =
              taskProgress.results.length > 0
                ? getImageUrl(taskProgress.results[0].url || taskProgress.results[0].key)
                : null;
            setResultVideoUrl(videoUrl);
            setState("result");
            refreshQuota();
            toast.success("视频生成完成！");
          } else if (taskProgress.status === "failed") {
            clearInterval(pollInterval);
            setState("idle");
            toast.error("生成失败", {
              description: taskProgress.errors.join(", ") || "请重试",
            });
          }
        } catch {
          clearInterval(pollInterval);
          setState("idle");
          toast.error("获取进度失败");
        }
      }, 2000);
    } catch (error) {
      setState("idle");
      setProgress(0);
      const message = error instanceof Error ? error.message : "生成失败";
      toast.error("生成失败", { description: message });
    }
  }, [uploadedImage, model, motionDescription, checkBeforeGenerate, refreshQuota]);

  const removeImage = () => {
    setUploadedImage(null);
    setFileName("");
    setFileSize("");
    setState("idle");
    setResultVideoUrl(null);
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <BackButton onClick={() => router.push("/")} />
          <div>
            <h1 className="text-text-primary text-2xl font-semibold">图生视频</h1>
            <p className="text-text-secondary text-sm">将静态图片转换为动态视频</p>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Image Upload or Video Result */}
          <div className="border-border bg-surface rounded-2xl border p-6">
            {state === "result" ? (
              /* Video Player */
              <div>
                <h3 className="text-text-primary mb-4 font-semibold">生成结果</h3>
                <div className="group bg-background relative aspect-video overflow-hidden rounded-xl">
                  {resultVideoUrl ? (
                    <video
                      src={resultVideoUrl}
                      className="h-full w-full object-cover"
                      controls
                      muted={isMuted}
                    />
                  ) : (
                    <img
                      src={uploadedImage || ""}
                      alt="Video result"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      if (resultVideoUrl) {
                        const link = document.createElement("a");
                        link.href = resultVideoUrl;
                        link.download = `video-${Date.now()}.mp4`;
                        link.click();
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载视频
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setState("idle");
                      setProgress(0);
                      setResultVideoUrl(null);
                    }}
                    className="rounded-xl"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    重新生成
                  </Button>
                </div>
              </div>
            ) : state === "generating" ? (
              /* Generating State */
              <div className="flex aspect-video flex-col items-center justify-center">
                <motion.div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-text-primary mb-2 text-xl font-semibold">生成视频中</h3>
                <p className="text-text-secondary mb-6 text-sm">{progress}%</p>
                <div className="w-full max-w-md">
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            ) : (
              /* Upload State */
              <div>
                <h3 className="text-text-primary mb-4 font-semibold">上传图片</h3>
                {!uploadedImage ? (
                  <label className="border-border bg-background hover:bg-surface flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all hover:border-[#7C3AED]">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
                      <Upload className="h-8 w-8 text-[#7C3AED]" />
                    </div>
                    <p className="text-text-primary mb-1 text-sm font-medium">上传一张图片</p>
                    <p className="text-text-secondary text-xs">
                      支持 PNG, JPG，建议 1024x1024 以上
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div>
                    <div className="relative aspect-video overflow-hidden rounded-xl">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm hover:bg-black/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="border-border bg-surface-secondary mt-3 rounded-lg border p-3">
                      <p className="text-text-primary text-sm">{fileName}</p>
                      <p className="text-text-secondary text-xs">{fileSize}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Parameters */}
          <div className="border-border bg-surface rounded-2xl border p-6">
            <h3 className="text-text-primary mb-4 font-semibold">参数设置</h3>

            <div className="space-y-4">
              {/* Motion Description */}
              <div>
                <label className="text-text-secondary mb-2 block text-sm">描述画面如何运动</label>
                <Textarea
                  placeholder="例如：镜头缓缓推进，花瓣随风飘落..."
                  value={motionDescription}
                  onChange={(e) => setMotionDescription(e.target.value)}
                  className="min-h-[120px] resize-none rounded-xl"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-secondary mb-2 block text-sm">时长</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2秒</SelectItem>
                      <SelectItem value="4">4秒</SelectItem>
                      <SelectItem value="6">6秒</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">运动强度</label>
                  <Select value={motionStrength} onValueChange={setMotionStrength}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">相机运动</label>
                  <Select value={cameraMotion} onValueChange={setCameraMotion}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      <SelectItem value="push">推进</SelectItem>
                      <SelectItem value="pull">拉远</SelectItem>
                      <SelectItem value="pan">平移</SelectItem>
                      <SelectItem value="orbit">环绕</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">模型</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="rounded-xl">
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
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!uploadedImage || state === "generating"}
                className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] py-6 hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90 disabled:opacity-50"
              >
                {state === "generating" ? "生成中..." : "生成视频"}
              </Button>

              {/* Tips */}
              <div className="border-border bg-surface-secondary rounded-xl border p-4">
                <h4 className="text-text-primary mb-2 text-sm font-medium">提示</h4>
                <ul className="text-text-secondary space-y-1 text-xs">
                  <li>• 清晰描述运动方向和速度可以获得更好效果</li>
                  <li>• 建议上传高分辨率图片（1024x1024 或更高）</li>
                  <li>• 相机运动会增加视频的动态感</li>
                  <li>• 运动强度越高，画面变化越明显</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
