"use client";

import { ChevronDown, ChevronUp, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";

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
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleAdvanced}
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
                    onChange={(e) => onSeedChange(e.target.value)}
                    placeholder="留空随机生成"
                    className="border-border bg-surface-elevated flex-1 rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onRandomSeed}
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
                  onChange={(e) => onNegativePromptChange(e.target.value)}
                  className="border-border bg-surface-elevated min-h-[60px] resize-none rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
