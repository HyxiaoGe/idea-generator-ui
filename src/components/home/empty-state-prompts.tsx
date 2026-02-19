"use client";

import { Sparkles, Film } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ExamplePrompt } from "@/lib/hooks/use-example-prompts";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
  return (
    <div className="border-border flex h-full flex-col items-center justify-center border-2 border-dashed p-8">
      <div className="from-primary-start/20 to-primary-end/20 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
        {contentType === "image" ? (
          <Sparkles className="text-primary-start h-8 w-8" />
        ) : (
          <Film className="text-primary-start h-8 w-8" />
        )}
      </div>
      <p className="text-text-secondary mb-6 text-center text-sm">{t("home.resultWillShow")}</p>

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
                  className="group border-border bg-surface-elevated text-text-primary hover:bg-surface hover:border-primary-start hover:shadow-primary-start/20 flex items-center gap-3 rounded-full border px-4 py-3 text-left text-sm transition-all hover:shadow-lg"
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
                        ? "bg-primary-start w-4"
                        : "bg-border hover:bg-primary-start/50 w-1.5"
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
