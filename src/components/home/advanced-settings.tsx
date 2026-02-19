"use client";

import { ChevronDown, ChevronUp, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "@/lib/i18n";

interface AdvancedSettingsProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  seed: string;
  onSeedChange: (seed: string) => void;
  onRandomSeed: () => void;
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
}

export function AdvancedSettings({
  showAdvanced,
  onToggleAdvanced,
  seed,
  onSeedChange,
  onRandomSeed,
  negativePrompt,
  onNegativePromptChange,
}: AdvancedSettingsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleAdvanced}
        className="text-text-secondary hover:text-text-primary w-full"
      >
        <span className="mr-2 text-xs">⚙️ {t("params.advanced")}</span>
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
                <label className="text-text-secondary mb-2 block text-xs">{t("params.seed")}</label>
                <div className="flex gap-2">
                  <Input
                    value={seed}
                    onChange={(e) => onSeedChange(e.target.value)}
                    placeholder={t("params.seedPlaceholder")}
                    className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 flex-1 rounded-xl focus:ring-2"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onRandomSeed}
                    aria-label={t("params.seed")}
                    className="border-border bg-surface-elevated rounded-xl"
                  >
                    <Dices className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-text-secondary mb-2 flex items-center justify-between text-xs">
                  <span>{t("params.guidanceStrength")}</span>
                  <span className="text-text-primary">7.5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  defaultValue="7.5"
                  step="0.5"
                  className="bg-border [&::-webkit-slider-thumb]:from-primary-start [&::-webkit-slider-thumb]:to-primary-end h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r"
                />
              </div>

              <div>
                <label className="text-text-secondary mb-2 block text-xs">
                  {t("params.negativePrompt")}
                </label>
                <Textarea
                  placeholder={t("params.negativePromptPlaceholder")}
                  value={negativePrompt}
                  onChange={(e) => onNegativePromptChange(e.target.value)}
                  className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 min-h-[60px] resize-none rounded-xl focus:ring-2"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
