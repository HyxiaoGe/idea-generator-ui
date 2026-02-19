"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import type { Language, GetPreferencesResponse } from "@/lib/types";
import type { TranslationKeys } from "./types";
import { zhCN } from "./locales/zh-CN";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

// ===== Locale map =====

const locales: Record<Language, TranslationKeys> = {
  "zh-CN": zhCN,
  en,
  ja,
};

// ===== Date locale map =====

export const dateLocaleMap: Record<Language, string> = {
  "zh-CN": "zh-CN",
  en: "en-US",
  ja: "ja-JP",
};

// ===== Module-level language getter/setter (for non-React code) =====

let _currentLanguage: Language = "zh-CN";

export function getCurrentLanguage(): Language {
  return _currentLanguage;
}

export function setCurrentLanguage(lang: Language) {
  _currentLanguage = lang;
}

export function getTranslations(lang?: Language): TranslationKeys {
  return locales[lang ?? _currentLanguage];
}

// ===== Interpolation =====

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

// ===== Translation function type =====

type TranslationPath = string;

function getNestedValue(obj: TranslationKeys, path: TranslationPath): string {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = current[key];
  }
  return typeof current === "string" ? current : path;
}

export type TFunction = (path: TranslationPath, params?: Record<string, string | number>) => string;

// ===== Context =====

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "app-language";

function detectLanguage(): Language {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh-CN" || stored === "en" || stored === "ja") {
      return stored;
    }

    // Detect from browser
    const browserLang = navigator.language;
    if (browserLang.startsWith("ja")) return "ja";
    if (browserLang.startsWith("en")) return "en";
  }
  return "zh-CN";
}

// ===== Provider =====

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always initialize with "zh-CN" to match server render and avoid hydration mismatch.
  // The real language is applied in a useEffect after hydration.
  const [language, setLanguage] = useState<Language>("zh-CN");
  const [hydrated, setHydrated] = useState(false);
  const { isAuthenticated } = useAuth();

  // Share cache key with settings page
  const { data: prefsData } = useSWR<GetPreferencesResponse>(
    isAuthenticated ? "/preferences" : null
  );

  // After hydration, apply the detected language from localStorage / browser
  useEffect(() => {
    const detected = detectLanguage();
    if (detected !== "zh-CN") {
      setLanguage(detected);
    }
    setHydrated(true);
  }, []);

  // Sync from API preferences (only after hydration to avoid overriding with stale data)
  useEffect(() => {
    if (!hydrated) return;
    if (prefsData?.preferences?.ui?.language) {
      const apiLang = prefsData.preferences.ui.language;
      if (apiLang !== language) {
        setLanguage(apiLang);
        localStorage.setItem(STORAGE_KEY, apiLang);
      }
    }
    // Only run when prefsData or hydrated changes, not language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsData, hydrated]);

  // Sync module-level getter and document lang attribute
  useEffect(() => {
    setCurrentLanguage(language);
    document.documentElement.lang = language;
    document.title = locales[language].common.appName;
  }, [language]);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setCurrentLanguage(lang);
  }, []);

  const t: TFunction = useCallback(
    (path: TranslationPath, params?: Record<string, string | number>) => {
      const value = getNestedValue(locales[language], path);
      return interpolate(value, params);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ===== Hook =====

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export type { TranslationKeys, Language };
