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
import { showErrorToast } from "@/lib/error-toast";
import { getProviderAndModel, getImageUrl } from "@/lib/transforms";
import { useQuota } from "@/lib/quota/quota-context";
import { useTranslation } from "@/lib/i18n";
import type { ProviderInfo } from "@/lib/types";

export default function ImageToVideoPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { checkBeforeGenerate, refreshQuota } = useQuota();
  const { t } = useTranslation();
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
        toast.success(t("imageToVideo.imageUploaded"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) {
      toast.error(t("imageToVideo.pleaseUploadFirst"));
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
            taskProgress.total && taskProgress.total > 0
              ? Math.round((taskProgress.progress / taskProgress.total) * 100)
              : Math.round(taskProgress.progress * 100);
          setProgress(pct);

          if (taskProgress.status === "completed") {
            clearInterval(pollInterval);
            const results = taskProgress.results || [];
            const videoUrl =
              results.length > 0 ? getImageUrl(results[0].url || results[0].key) : null;
            setResultVideoUrl(videoUrl);
            setState("result");
            refreshQuota();
            toast.success(t("generation.videoComplete"));
          } else if (taskProgress.status === "failed") {
            clearInterval(pollInterval);
            setState("idle");
            toast.error(t("generation.failed"), {
              description:
                taskProgress.errors?.join(", ") || taskProgress.error || t("common.retry"),
            });
          }
        } catch {
          clearInterval(pollInterval);
          setState("idle");
          toast.error(t("imageToVideo.progressFailed"));
        }
      }, 2000);
    } catch (error) {
      setState("idle");
      setProgress(0);
      showErrorToast(error, t("generation.failed"));
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
            <h1 className="text-text-primary text-2xl font-semibold">{t("imageToVideo.title")}</h1>
            <p className="text-text-secondary text-sm">{t("imageToVideo.subtitle")}</p>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Image Upload or Video Result */}
          <div className="border-border bg-surface rounded-2xl border p-6">
            {state === "result" ? (
              /* Video Player */
              <div>
                <h3 className="text-text-primary mb-4 font-semibold">
                  {t("imageToVideo.generationResult")}
                </h3>
                <div className="group bg-background relative aspect-video overflow-hidden rounded-xl">
                  {resultVideoUrl ? (
                    <video
                      src={resultVideoUrl}
                      className="h-full w-full object-cover"
                      controls
                      muted={isMuted}
                    />
                  ) : uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Video result"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
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
                    {t("imageToVideo.downloadVideo")}
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
                    {t("chat.regenerate")}
                  </Button>
                </div>
              </div>
            ) : state === "generating" ? (
              /* Generating State */
              <div className="flex aspect-video flex-col items-center justify-center">
                <motion.div
                  className="from-primary-start to-primary-end mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-text-primary mb-2 text-xl font-semibold">
                  {t("imageToVideo.generatingVideo")}
                </h3>
                <p className="text-text-secondary mb-6 text-sm">{progress}%</p>
                <div className="w-full max-w-md">
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            ) : (
              /* Upload State */
              <div>
                <h3 className="text-text-primary mb-4 font-semibold">
                  {t("imageToVideo.uploadImage")}
                </h3>
                {!uploadedImage ? (
                  <label className="border-border bg-background hover:bg-surface hover:border-primary-start flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all">
                    <div className="from-primary-start/20 to-primary-end/20 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
                      <Upload className="text-primary-start h-8 w-8" />
                    </div>
                    <p className="text-text-primary mb-1 text-sm font-medium">
                      {t("imageToVideo.uploadImageLabel")}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {t("imageToVideo.uploadImageHint")}
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
            <h3 className="text-text-primary mb-4 font-semibold">
              {t("imageToVideo.paramSettings")}
            </h3>

            <div className="space-y-4">
              {/* Motion Description */}
              <div>
                <label className="text-text-secondary mb-2 block text-sm">
                  {t("imageToVideo.motionDesc")}
                </label>
                <Textarea
                  placeholder={t("imageToVideo.motionDescPlaceholder")}
                  value={motionDescription}
                  onChange={(e) => setMotionDescription(e.target.value)}
                  className="min-h-[120px] resize-none rounded-xl"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-secondary mb-2 block text-sm">
                    {t("params.duration")}
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{t("params.durationSeconds", { n: 2 })}</SelectItem>
                      <SelectItem value="4">{t("params.durationSeconds", { n: 4 })}</SelectItem>
                      <SelectItem value="6">{t("params.durationSeconds", { n: 6 })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">
                    {t("params.motionStrength")}
                  </label>
                  <Select value={motionStrength} onValueChange={setMotionStrength}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("params.low")}</SelectItem>
                      <SelectItem value="medium">{t("params.medium")}</SelectItem>
                      <SelectItem value="high">{t("params.high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">
                    {t("imageToVideo.cameraMotion")}
                  </label>
                  <Select value={cameraMotion} onValueChange={setCameraMotion}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("imageToVideo.cameraNone")}</SelectItem>
                      <SelectItem value="push">{t("imageToVideo.cameraPush")}</SelectItem>
                      <SelectItem value="pull">{t("imageToVideo.cameraPull")}</SelectItem>
                      <SelectItem value="pan">{t("imageToVideo.cameraPan")}</SelectItem>
                      <SelectItem value="orbit">{t("imageToVideo.cameraOrbit")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-text-secondary mb-2 block text-sm">
                    {t("params.model")}
                  </label>
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
                className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 w-full rounded-xl bg-gradient-to-r py-6 disabled:opacity-50"
              >
                {state === "generating"
                  ? t("common.generating") + "..."
                  : t("imageToVideo.generateVideo")}
              </Button>

              {/* Tips */}
              <div className="border-border bg-surface-secondary rounded-xl border p-4">
                <h4 className="text-text-primary mb-2 text-sm font-medium">
                  {t("imageToVideo.tipsTitle")}
                </h4>
                <ul className="text-text-secondary space-y-1 text-xs">
                  <li>• {t("imageToVideo.tip1")}</li>
                  <li>• {t("imageToVideo.tip2")}</li>
                  <li>• {t("imageToVideo.tip3")}</li>
                  <li>• {t("imageToVideo.tip4")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
