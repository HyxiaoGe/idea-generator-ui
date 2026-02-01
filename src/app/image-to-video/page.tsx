"use client";

import { useState } from "react";
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

export default function ImageToVideoPage() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [motionDescription, setMotionDescription] = useState("");
  const [duration, setDuration] = useState("4");
  const [motionStrength, setMotionStrength] = useState("medium");
  const [cameraMotion, setCameraMotion] = useState("none");
  const [model, setModel] = useState("runway");
  const [state, setState] = useState<"idle" | "generating" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast.error("请先上传图片");
      return;
    }

    setState("generating");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState("result");
          toast.success("视频生成完成！");
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setFileName("");
    setFileSize("");
    setState("idle");
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <BackButton onClick={() => router.push("/")} />
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">图生视频</h1>
          <p className="text-sm text-text-secondary">
            将静态图片转换为动态视频
          </p>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Image Upload or Video Result */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          {state === "result" ? (
            /* Video Player */
            <div>
              <h3 className="mb-4 font-semibold text-text-primary">生成结果</h3>
              <div className="group relative aspect-video overflow-hidden rounded-xl bg-background">
                {/* Mock Video Thumbnail */}
                <img
                  src={uploadedImage || ""}
                  alt="Video result"
                  className="h-full w-full object-cover"
                />

                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Button
                    size="lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-xl hover:bg-white/30"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-white" fill="white" />
                    ) : (
                      <Play className="h-8 w-8 text-white" fill="white" />
                    )}
                  </Button>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="mb-2">
                    <Progress value={45} className="h-1" />
                  </div>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-xs">1:24 / 4:00</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsMuted(!isMuted)}
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载视频
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setState("idle");
                    setProgress(0);
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
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                生成视频中
              </h3>
              <p className="mb-6 text-sm text-text-secondary">{progress}%</p>
              <div className="w-full max-w-md">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="mt-4 text-xs text-text-secondary">
                预计需要 {Math.ceil((100 - progress) * 0.5)} 秒
              </p>
            </div>
          ) : (
            /* Upload State */
            <div>
              <h3 className="mb-4 font-semibold text-text-primary">上传图片</h3>
              {!uploadedImage ? (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background transition-all hover:border-[#7C3AED] hover:bg-surface">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
                    <Upload className="h-8 w-8 text-[#7C3AED]" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-text-primary">
                    上传一张图片
                  </p>
                  <p className="text-xs text-text-secondary">
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
                      className="absolute right-2 top-2 bg-black/60 backdrop-blur-sm hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-3">
                    <p className="text-sm text-text-primary">{fileName}</p>
                    <p className="text-xs text-text-secondary">{fileSize}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Parameters */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-semibold text-text-primary">参数设置</h3>

          <div className="space-y-4">
            {/* Motion Description */}
            <div>
              <label className="mb-2 block text-sm text-text-secondary">
                描述画面如何运动
              </label>
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
                <label className="mb-2 block text-sm text-text-secondary">
                  时长
                </label>
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
                <label className="mb-2 block text-sm text-text-secondary">
                  运动强度
                </label>
                <Select
                  value={motionStrength}
                  onValueChange={setMotionStrength}
                >
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
                <label className="mb-2 block text-sm text-text-secondary">
                  相机运动
                </label>
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
                <label className="mb-2 block text-sm text-text-secondary">
                  模型
                </label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="runway">Runway</SelectItem>
                    <SelectItem value="pika">Pika</SelectItem>
                    <SelectItem value="minimax">MiniMax</SelectItem>
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
            <div className="rounded-xl border border-border bg-surface-secondary p-4">
              <h4 className="mb-2 text-sm font-medium text-text-primary">
                提示
              </h4>
              <ul className="space-y-1 text-xs text-text-secondary">
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
  );
}
