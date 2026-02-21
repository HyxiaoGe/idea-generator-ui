"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { X, Plus, Download, RotateCw, ChevronRight } from "lucide-react";
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
import { RequireAuth } from "@/lib/auth/require-auth";
import { useQuota } from "@/lib/quota/quota-context";
import { useTranslation } from "@/lib/i18n";
import { getApiClient } from "@/lib/api-client";
import { showErrorToast } from "@/lib/error-toast";
import { getImageUrl } from "@/lib/transforms";
import { useTaskProgress } from "@/lib/hooks/use-task-progress";
import { useAuth } from "@/lib/auth/auth-context";
import { ProgressiveImage } from "@/components/progressive-image";
import { ImageLightbox, type LightboxSlide } from "@/components/image-lightbox";
import { ImagePickerDialog, type SelectedImage } from "@/components/image-picker-dialog";
import type { PaginatedResponse, HistoryItem } from "@/lib/types";

type BlendState = "idle" | "generating" | "result";

export default function BlendPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { checkBeforeGenerate, refreshQuota } = useQuota();
  const { isAuthenticated } = useAuth();

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [blendPrompt, setBlendPrompt] = useState("");
  const [_blendMode, setBlendMode] = useState("smart");
  const [state, setState] = useState<BlendState>("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Recent blend results
  const {
    data: blendHistoryData,
    isLoading: blendHistoryLoading,
    mutate: refreshBlendHistory,
  } = useSWR<PaginatedResponse<HistoryItem>>(
    isAuthenticated ? "/history?limit=6&mode=blend" : null
  );
  const recentBlends = useMemo(() => blendHistoryData?.items || [], [blendHistoryData]);
  const recentLightboxSlides: LightboxSlide[] = useMemo(
    () =>
      recentBlends.map((item) => ({
        src: getImageUrl(item.url || item.r2_key),
        alt: item.prompt,
        historyItem: item,
      })),
    [recentBlends]
  );

  const { progress } = useTaskProgress(taskId, {
    onComplete: (tp) => {
      const url = tp.result?.image
        ? getImageUrl(tp.result.image.url || tp.result.image.key)
        : tp.results?.length
          ? getImageUrl(tp.results[0].url || tp.results[0].key)
          : null;
      setResultImageUrl(url);
      setState("result");
      refreshQuota();
      refreshBlendHistory();
      toast.success(t("blend.blendComplete"));
    },
    onFailed: (tp) => {
      setState("idle");
      setTaskId(null);
      toast.error(t("generation.failed"), {
        description: tp.errors?.join(", ") || tp.error || t("common.retry"),
      });
    },
  });

  const handlePickerConfirm = useCallback((images: SelectedImage[]) => {
    setSelectedImages(images);
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleBlend = async () => {
    if (selectedImages.length < 2) {
      toast.error(t("blend.minImagesError"));
      return;
    }
    const allowed = await checkBeforeGenerate();
    if (!allowed) return;

    setState("generating");
    try {
      const api = getApiClient();
      const result = await api.blendImages({
        image_keys: selectedImages.map((img) => img.key),
        blend_prompt: blendPrompt || undefined,
      });
      setTaskId(result.task_id);
    } catch (error) {
      setState("idle");
      showErrorToast(error, t("generation.failed"));
    }
  };

  const handleReblend = () => {
    setState("idle");
    setTaskId(null);
    setResultImageUrl(null);
  };

  const handleDownload = () => {
    if (!resultImageUrl) return;
    const a = document.createElement("a");
    a.href = resultImageUrl;
    a.download = `blend-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <BackButton onClick={() => router.push("/")} />
        <h1 className="text-text-primary text-2xl font-semibold">{t("blend.title")}</h1>
      </div>

      <RequireAuth>
        {/* Selected images section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          {selectedImages.length > 0 && (
            <h3 className="text-text-primary mb-4 font-semibold">
              {t("blend.selectedImages", { count: selectedImages.length })}
            </h3>
          )}

          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {selectedImages.map((img, index) => (
                <motion.div
                  key={img.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group border-border relative aspect-square overflow-hidden rounded-xl border"
                >
                  <img
                    src={img.previewUrl}
                    alt={img.label || `Image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {state !== "generating" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 p-0 hover:bg-red-600"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  )}
                  <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                    {index + 1}
                  </div>
                  {img.label && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2 pt-6 pb-2">
                      <p className="truncate text-xs text-white/80">{img.label}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              {selectedImages.length < 4 && state !== "generating" && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="border-border bg-background hover:bg-surface hover:border-primary-start flex aspect-square items-center justify-center rounded-xl border-2 border-dashed transition-all"
                >
                  <Plus className="text-text-secondary h-8 w-8" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="border-border bg-background hover:bg-surface hover:border-primary-start flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed py-12 transition-all"
            >
              <div className="text-center">
                <div className="from-primary-start/20 to-primary-end/20 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-3xl">
                  <Plus className="text-primary-start h-8 w-8" />
                </div>
                <p className="text-text-primary mb-1 text-sm font-medium">
                  {t("blend.selectImages")}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Blend instruction + mode */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <label className="text-text-primary mb-3 block font-semibold">
            {t("blend.blendInstruction")}
          </label>
          <Textarea
            placeholder={t("blend.blendInstructionPlaceholder")}
            value={blendPrompt}
            onChange={(e) => setBlendPrompt(e.target.value)}
            className="mb-4 min-h-[100px] resize-none rounded-xl"
            disabled={state === "generating"}
          />

          <div>
            <label className="text-text-secondary mb-2 block text-xs">{t("blend.blendMode")}</label>
            <Select
              defaultValue="smart"
              onValueChange={setBlendMode}
              disabled={state === "generating"}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smart">{t("blend.smartBlend")}</SelectItem>
                <SelectItem value="style">{t("blend.styleUnify")}</SelectItem>
                <SelectItem value="collage">{t("blend.elementCollage")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Start blend button */}
        <Button
          onClick={handleBlend}
          disabled={selectedImages.length < 2 || state === "generating"}
          className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 mb-6 w-full rounded-xl bg-gradient-to-r py-6"
        >
          {state === "generating" ? t("blend.blending") : t("blend.startBlend")}
        </Button>

        {/* Progress */}
        {state === "generating" && (
          <div className="border-border bg-surface mb-6 rounded-2xl border p-8">
            <div className="mb-4 text-center">
              <p className="text-text-primary mb-2 text-lg font-semibold">{t("blend.blending")}</p>
              <p className="text-text-secondary text-sm">{progress}%</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Result */}
        {state === "result" && resultImageUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="bg-border h-px flex-1" />
              <span className="text-text-secondary text-sm">{t("blend.blendResult")}</span>
              <div className="bg-border h-px flex-1" />
            </div>

            <div className="border-border bg-surface rounded-2xl border p-6">
              <img src={resultImageUrl} alt="Blended result" className="mb-4 w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="rounded-xl" onClick={handleDownload}>
                  <Download className="mr-1.5 h-4 w-4" />
                  {t("blend.downloadOriginal")}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={handleReblend}>
                  <RotateCw className="mr-1.5 h-4 w-4" />
                  {t("blend.reblend")}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => router.push("/")}>
                  {t("common.continueCreating")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent blend history */}
        {isAuthenticated && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text-primary font-semibold">{t("recentGenerations.title")}</h2>
              <Button
                variant="ghost"
                onClick={() => router.push("/gallery?mode=blend")}
                className="text-accent hover:text-accent/80"
              >
                {t("common.viewAll")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {blendHistoryLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface-elevated aspect-square w-[160px] flex-shrink-0 animate-pulse rounded-xl"
                  />
                ))
              ) : recentBlends.length === 0 ? (
                <div className="flex w-full items-center justify-center py-8">
                  <p className="text-text-secondary text-sm">{t("recentGenerations.noRecords")}</p>
                </div>
              ) : (
                recentBlends.map((item, index) => (
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
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute right-0 bottom-0 left-0 p-3">
                        <p className="line-clamp-2 text-xs text-white">{item.prompt}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <ImageLightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={recentLightboxSlides}
              index={lightboxIndex}
            />
          </div>
        )}

        <ImagePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onConfirm={handlePickerConfirm}
          minImages={2}
          maxImages={4}
        />
      </RequireAuth>
    </div>
  );
}
