"use client";

import { Sparkles, BookOpen, Wand2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "motion/react";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  selectedTemplateId: string | null;
  onClearTemplate: () => void;
  enhancePrompt: boolean;
  onToggleEnhance: () => void;
  onGenerate: () => void;
  onNavigateTemplates: () => void;
  isGenerating: boolean;
}

export function PromptInput({
  prompt,
  onPromptChange,
  selectedTemplateId,
  onClearTemplate,
  enhancePrompt,
  onToggleEnhance,
  onGenerate,
  onNavigateTemplates,
  isGenerating,
}: PromptInputProps) {
  return (
    <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
      <div className="relative">
        {selectedTemplateId && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#7C3AED]/20 px-2 py-0.5 text-xs text-[#7C3AED]">
              模板
              <button onClick={onClearTemplate} className="hover:text-[#7C3AED]/70">
                ✕
              </button>
            </span>
          </div>
        )}
        <Textarea
          placeholder="描述你想要生成的画面..."
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onGenerate();
            }
          }}
          className={`border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary min-h-[120px] resize-none rounded-xl pr-32 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 ${selectedTemplateId ? "pt-10" : ""}`}
        />
        <div className="absolute right-3 bottom-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigateTemplates}
            className="text-text-secondary hover:bg-surface-elevated hover:text-text-primary h-9 w-9 p-0"
            title="模板"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleEnhance}
            disabled={!prompt}
            className={`h-9 w-9 p-0 disabled:opacity-50 ${
              enhancePrompt
                ? "bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30"
                : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
            title={enhancePrompt ? "AI优化已开启" : "AI优化"}
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={onGenerate}
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
  );
}
