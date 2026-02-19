"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Download, RotateCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

export default function StylePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [contentImage, setContentImage] = useState<string | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [resultImage] = useState(
    "https://images.unsplash.com/photo-1655435439159-92d407ae9ab5?w=800"
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "content" | "style") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === "content") setContentImage(result);
        else setStyleImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransfer = () => {
    setState("loading");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState("result");
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => router.push("/")} />
          <h1 className="text-text-primary text-2xl font-semibold">{t("style.title")}</h1>
        </div>
      </div>

      <div className="border-warning/30 bg-warning/10 mb-6 rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h3 className="text-text-primary font-semibold">{t("style.devWarning")}</h3>
            <p className="text-text-secondary text-sm">{t("style.devWarningDesc")}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-[1fr,auto,1fr]">
        <div className="border-border bg-surface rounded-2xl border p-6">
          <h3 className="text-text-primary mb-4 font-semibold">{t("style.contentImage")}</h3>
          {!contentImage ? (
            <label className="border-border bg-background hover:bg-surface hover:border-primary-start flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all">
              <div className="from-primary-start/20 to-primary-end/20 mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-3xl">
                🖼️
              </div>
              <p className="text-text-primary mb-1 text-sm font-medium">{t("style.dragOrClick")}</p>
              <p className="text-text-secondary text-xs">{t("style.supportedFormats")}</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "content")}
              />
            </label>
          ) : (
            <div className="relative">
              <img src={contentImage} alt="Content" className="w-full rounded-xl" />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm hover:bg-black/80"
                onClick={() => setContentImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-text-secondary mt-3 text-center text-xs">
            {t("style.contentImageHint")}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="bg-surface text-primary-start flex h-12 w-12 items-center justify-center rounded-full">
            →
          </div>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-6">
          <h3 className="text-text-primary mb-4 font-semibold">{t("style.styleReference")}</h3>
          {!styleImage ? (
            <label className="border-border bg-background hover:bg-surface hover:border-primary-start flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all">
              <div className="from-primary-start/20 to-primary-end/20 mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-3xl">
                🎨
              </div>
              <p className="text-text-primary mb-1 text-sm font-medium">{t("style.dragOrClick")}</p>
              <p className="text-text-secondary text-xs">{t("style.supportedFormats")}</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "style")}
              />
            </label>
          ) : (
            <div className="relative">
              <img src={styleImage} alt="Style" className="w-full rounded-xl" />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm hover:bg-black/80"
                onClick={() => setStyleImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-text-secondary mt-3 text-center text-xs">
            {t("style.styleReferenceHint")}
          </p>
        </div>
      </div>

      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        <label className="text-text-primary mb-3 block font-semibold">
          {t("style.transferInstruction")}
        </label>
        <Textarea
          placeholder={t("style.transferInstructionPlaceholder")}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          className="min-h-[80px] resize-none rounded-xl"
        />
        <p className="text-text-secondary mt-2 text-xs">{t("style.transferInstructionHint")}</p>
      </div>

      <Button
        onClick={handleTransfer}
        disabled={!contentImage || !styleImage || state === "loading"}
        className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 mb-6 w-full rounded-xl bg-gradient-to-r py-6"
      >
        {t("style.startTransfer")}
      </Button>

      {state === "loading" && (
        <div className="border-border bg-surface mb-6 rounded-2xl border p-8">
          <div className="mb-4 text-center">
            <p className="text-text-primary mb-2 text-lg font-semibold">
              {t("style.transferring")}
            </p>
            <p className="text-text-secondary text-sm">{progress}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {state === "result" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="bg-border h-px flex-1"></div>
            <span className="text-text-secondary text-sm">{t("style.generationResult")}</span>
            <div className="bg-border h-px flex-1"></div>
          </div>

          <div className="border-border bg-surface rounded-2xl border p-6">
            <img src={resultImage} alt="Result" className="mb-4 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="rounded-xl">
                <Download className="mr-2 h-4 w-4" />
                {t("style.downloadOriginal")}
              </Button>
              <Button variant="outline" className="rounded-xl">
                <RotateCw className="mr-2 h-4 w-4" />
                {t("style.retransfer")}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/")}>
                <Plus className="mr-2 h-4 w-4" />
                {t("common.continueCreating")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
