"use client";

import { Sparkles, Film } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ExamplePrompt } from "@/lib/hooks/use-example-prompts";

interface EmptyStatePromptsProps {
  contentType: "image" | "video";
  examplePrompts: ExamplePrompt[];
  promptPage: number;
  totalPages: number;
  onPromptSelect: (templateId: string, text: string) => void;
  onPageChange: (page: number) => void;
  onPauseChange: (paused: boolean) => void;
}

export function EmptyStatePrompts({
  contentType,
  examplePrompts,
  promptPage,
  totalPages,
  onPromptSelect,
  onPageChange,
  onPauseChange,
}: EmptyStatePromptsProps) {
  return (
    <div className="border-border flex h-full flex-col items-center justify-center border-2 border-dashed p-8">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
        {contentType === "image" ? (
          <Sparkles className="h-8 w-8 text-[#7C3AED]" />
        ) : (
          <Film className="h-8 w-8 text-[#7C3AED]" />
        )}
      </div>
      <p className="text-text-secondary mb-6 text-center text-sm">生成结果将在此显示</p>

      {examplePrompts.length > 0 && (
        <div
          className="flex flex-col items-center gap-3"
          onMouseEnter={() => onPauseChange(true)}
          onMouseLeave={() => onPauseChange(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={promptPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2"
            >
              {examplePrompts.map((example) => (
                <motion.button
                  key={example.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onPromptSelect(example.id, example.text)}
                  className="group border-border bg-surface-elevated text-text-primary hover:bg-surface flex items-center gap-3 rounded-full border px-4 py-3 text-left text-sm transition-all hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20"
                >
                  <span className="text-xl">{example.emoji}</span>
                  <span className="flex-1 truncate">{example.text}</span>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className="flex items-center justify-center px-0.5 py-2"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === promptPage
                        ? "w-4 bg-[#7C3AED]"
                        : "w-1.5 bg-[#3F3F46] hover:bg-[#7C3AED]/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
