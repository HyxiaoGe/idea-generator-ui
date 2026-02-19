"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ModelSelector } from "@/components/model-selector";
import type { AspectRatio, QualityPreset } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface ImageParamsProps {
  qualityPreset: QualityPreset;
  onPresetChange: (preset: QualityPreset) => void;
  manualModel: string | null;
  onManualModelChange: (model: string | null) => void;
  resolution: string;
  onResolutionChange: (resolution: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  count: number;
  onCountChange: (count: number) => void;
  searchGrounding: boolean;
  onSearchGroundingChange: (enabled: boolean) => void;
  isAuthenticated: boolean;
}

export function ImageParams({
  qualityPreset,
  onPresetChange,
  manualModel,
  onManualModelChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  count,
  onCountChange,
  searchGrounding,
  onSearchGroundingChange,
  isAuthenticated,
}: ImageParamsProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-4">
        <label className="text-text-secondary mb-2 block text-xs">{t("params.model")}</label>
        <ModelSelector
          qualityPreset={qualityPreset}
          onPresetChange={onPresetChange}
          manualModel={manualModel}
          onManualModelChange={onManualModelChange}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className="text-text-secondary mb-2 block text-xs">{t("params.resolution")}</label>
          <Select value={resolution} onValueChange={onResolutionChange}>
            <SelectTrigger className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 h-9 rounded-xl text-sm focus:ring-2">
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
          <label className="text-text-secondary mb-2 block text-xs">
            {t("params.aspectRatio")}
          </label>
          <Select value={aspectRatio} onValueChange={(v) => onAspectRatioChange(v as AspectRatio)}>
            <SelectTrigger className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 h-9 rounded-xl text-sm focus:ring-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1 {t("enums.aspectRatio.1:1")}</SelectItem>
              <SelectItem value="16:9">16:9 {t("enums.aspectRatio.16:9")}</SelectItem>
              <SelectItem value="9:16">9:16 {t("enums.aspectRatio.9:16")}</SelectItem>
              <SelectItem value="4:3">4:3 {t("enums.aspectRatio.4:3")}</SelectItem>
              <SelectItem value="3:4">3:4 {t("enums.aspectRatio.3:4")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-text-secondary mb-2 block text-xs">{t("params.count")}</label>
          <Select value={count.toString()} onValueChange={(v) => onCountChange(parseInt(v))}>
            <SelectTrigger className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 h-9 rounded-xl text-sm focus:ring-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">x1</SelectItem>
              <SelectItem value="2">x2</SelectItem>
              <SelectItem value="4">x4</SelectItem>
              <SelectItem value="8">x8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-end">
          <div
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ${
              manualModel?.includes("google")
                ? "border-border bg-surface-elevated border"
                : !manualModel
                  ? "border-border bg-surface-elevated border"
                  : "border-border bg-surface border border-dashed opacity-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-text-primary text-sm">🔍 {t("params.searchGrounding")}</span>
              {manualModel ? (
                manualModel.includes("google") ? (
                  <span className="bg-accent/20 text-accent rounded-md px-2 py-0.5 text-xs">
                    {t("params.geminiExclusive")}
                  </span>
                ) : (
                  <span className="text-text-secondary text-xs">
                    {t("params.currentModelNotSupported")}
                  </span>
                )
              ) : (
                <span className="text-text-secondary text-xs">{t("params.presetAutoSelect")}</span>
              )}
            </div>
            <Switch
              checked={searchGrounding}
              onCheckedChange={onSearchGroundingChange}
              disabled={manualModel != null && !manualModel.includes("google")}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>
      </div>
    </>
  );
}
