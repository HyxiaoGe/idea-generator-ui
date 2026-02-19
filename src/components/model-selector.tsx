"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import useSWR from "swr";
import type { QualityPreset, ModelsResponse } from "@/lib/types";

interface ModelSelectorProps {
  qualityPreset: QualityPreset;
  onPresetChange: (preset: QualityPreset) => void;
  manualModel: string | null;
  onManualModelChange: (model: string | null) => void;
  isAuthenticated: boolean;
}

const FALLBACK_PRESETS: {
  id: QualityPreset;
  icon: string;
  name_zh: string;
  description_zh: string;
  is_default?: boolean;
}[] = [
  { id: "premium", icon: "✨", name_zh: "精品", description_zh: "最佳画质" },
  { id: "balanced", icon: "⚖️", name_zh: "均衡", description_zh: "推荐", is_default: true },
  { id: "fast", icon: "⚡", name_zh: "极速", description_zh: "最快出图" },
];

export function ModelSelector({
  qualityPreset,
  onPresetChange,
  manualModel,
  onManualModelChange,
  isAuthenticated,
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const [showAdvancedModels, setShowAdvancedModels] = useState(false);

  const { data: modelsData } = useSWR<ModelsResponse>(isAuthenticated ? "/models" : null);

  const presets = modelsData?.presets ?? FALLBACK_PRESETS;
  const models = modelsData?.models ?? [];

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, typeof models> = {};
    for (const m of models) {
      const key = m.provider_display_name || m.provider;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [models]);

  // Find the display name for the currently selected manual model
  const manualModelName = useMemo(() => {
    if (!manualModel) return null;
    const found = models.find((m) => `${m.provider}:${m.id}` === manualModel);
    return found ? `${found.provider_display_name} ${found.name}` : manualModel;
  }, [manualModel, models]);

  const handlePresetClick = (presetId: QualityPreset) => {
    onManualModelChange(null);
    onPresetChange(presetId);
  };

  return (
    <div className="space-y-3">
      {/* Manual model override banner */}
      <AnimatePresence>
        {manualModel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-primary-start/30 bg-primary-start/10 flex items-center justify-between rounded-xl border px-3 py-2">
              <span className="text-primary-start text-xs">
                {t("params.manualSelection", { name: manualModelName || "" })}
              </span>
              <button
                onClick={() => onManualModelChange(null)}
                className="text-primary-start hover:bg-primary-start/20 rounded-md p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset) => {
          const isSelected = !manualModel && qualityPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all",
                manualModel && "opacity-50",
                isSelected
                  ? "border-primary-start bg-primary-start/10 ring-primary-start/30 ring-2"
                  : "border-border bg-surface-elevated hover:border-primary-start/50"
              )}
            >
              <span className="text-lg">{preset.icon}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary-start" : "text-text-primary"
                )}
              >
                {preset.name_zh}
              </span>
              <span className="text-text-secondary text-xs">{preset.description_zh}</span>
              {preset.is_default && (
                <span className="from-primary-start to-primary-end absolute -top-1.5 right-2 rounded-full bg-gradient-to-r px-1.5 py-0 text-[10px] font-medium text-white">
                  {t("common.recommended")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Advanced model picker toggle */}
      {models.length > 0 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedModels(!showAdvancedModels)}
            className="text-text-secondary hover:text-text-primary w-full"
          >
            <span className="mr-2 text-xs">🔧 {t("params.advancedOptions")}</span>
            {showAdvancedModels ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          <AnimatePresence>
            {showAdvancedModels && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-border space-y-4 rounded-xl border p-4">
                  <RadioGroup
                    value={manualModel ?? ""}
                    onValueChange={(value) => onManualModelChange(value || null)}
                    className="gap-0"
                  >
                    {Object.entries(groupedModels).map(([providerName, providerModels]) => (
                      <div key={providerName} className="space-y-1">
                        <div className="text-text-secondary px-1 pt-3 pb-1 text-xs font-medium first:pt-0">
                          {providerName}
                        </div>
                        {providerModels.map((m) => {
                          const value = `${m.provider}:${m.id}`;
                          const isSelected = manualModel === value;
                          return (
                            <label
                              key={value}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                                isSelected ? "bg-primary-start/10" : "hover:bg-surface-elevated"
                              )}
                            >
                              <RadioGroupItem value={value} />
                              <span
                                className={cn(
                                  "flex-1 text-sm",
                                  isSelected
                                    ? "text-primary-start font-medium"
                                    : "text-text-primary"
                                )}
                              >
                                {m.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {m.tier && (
                                  <span
                                    className={cn(
                                      "rounded-md px-1.5 py-0.5 text-[10px]",
                                      m.tier === "premium"
                                        ? "bg-warning/20 text-warning"
                                        : m.tier === "standard"
                                          ? "bg-accent/20 text-accent"
                                          : "text-text-secondary bg-border"
                                    )}
                                  >
                                    {m.tier}
                                  </span>
                                )}
                                {m.speed && (
                                  <span className="text-text-secondary bg-border rounded-md px-1.5 py-0.5 text-[10px]">
                                    {m.speed}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </RadioGroup>

                  {manualModel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManualModelChange(null)}
                      className="text-text-secondary hover:text-text-primary w-full text-xs"
                    >
                      {t("params.clearManualSelection")}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
