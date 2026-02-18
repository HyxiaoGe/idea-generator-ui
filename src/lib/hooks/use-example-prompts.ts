"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import type { TemplateListItem, GetPreferencesResponse } from "@/lib/types";
import { getTemplateDescription } from "@/lib/transforms";

export const CATEGORY_EMOJIS: Record<string, string> = {
  abstract: "🎨",
  portrait: "👤",
  landscape: "🌄",
  animal: "🐾",
  food: "🍜",
  architecture: "🏛️",
  scifi: "🚀",
  fantasy: "✨",
};

export interface ExamplePrompt {
  id: string;
  emoji: string;
  text: string;
}

const PAGE_SIZE = 4;

export function useExamplePrompts(isAuthenticated: boolean) {
  const { data: recommendedData } = useSWR<TemplateListItem[]>(
    isAuthenticated ? "/templates/recommended?limit=40" : null
  );

  const { data: prefsData } = useSWR<GetPreferencesResponse>(
    isAuthenticated ? "/preferences" : null
  );
  const lang = prefsData?.preferences?.ui?.language;

  const allExamplePrompts = useMemo<ExamplePrompt[]>(() => {
    if (!recommendedData || recommendedData.length === 0) return [];
    return recommendedData.map((t) => ({
      id: t.id,
      emoji: CATEGORY_EMOJIS[t.category] || "✨",
      text: getTemplateDescription(t, lang),
    }));
  }, [recommendedData, lang]);

  const [promptPage, setPromptPage] = useState(0);
  const [promptPaused, setPromptPaused] = useState(false);
  const totalPages = Math.max(1, Math.ceil(allExamplePrompts.length / PAGE_SIZE));

  // Auto-rotate every 5 seconds, pause on hover
  useEffect(() => {
    if (allExamplePrompts.length <= PAGE_SIZE || promptPaused) return;
    const timer = setInterval(() => {
      setPromptPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [allExamplePrompts.length, totalPages, promptPaused]);

  const examplePrompts = useMemo(() => {
    const start = promptPage * PAGE_SIZE;
    return allExamplePrompts.slice(start, start + PAGE_SIZE);
  }, [allExamplePrompts, promptPage]);

  return {
    allExamplePrompts,
    examplePrompts,
    promptPage,
    setPromptPage,
    promptPaused,
    setPromptPaused,
    totalPages,
  };
}
