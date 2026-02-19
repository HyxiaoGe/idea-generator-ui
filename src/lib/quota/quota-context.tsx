"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/auth-context";
import type { QuotaStatusResponse } from "@/lib/types";
import { getApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { getTranslations, getCurrentLanguage, dateLocaleMap, interpolate } from "@/lib/i18n";

interface QuotaContextType {
  quota: QuotaStatusResponse | null;
  isLoading: boolean;
  error: Error | undefined;
  refreshQuota: () => void;
  checkBeforeGenerate: () => Promise<boolean>;
}

const QuotaContext = createContext<QuotaContextType | null>(null);

export function QuotaProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const {
    data: quota,
    error,
    isLoading,
    mutate,
  } = useSWR<QuotaStatusResponse>(isAuthenticated ? "/quota" : null, {
    refreshInterval: 60000, // refresh every minute
  });

  const refreshQuota = useCallback(() => {
    mutate();
  }, [mutate]);

  const checkBeforeGenerate = useCallback(async () => {
    try {
      const client = getApiClient();
      const result = await client.checkQuota();
      if (!result.can_generate) {
        const t = getTranslations();
        const lang = getCurrentLanguage();
        toast.error(t.quota.cannotGenerate, {
          description:
            result.reason ||
            (quota?.resets_at
              ? interpolate(t.settings.resetsAt, {
                  date: new Date(quota.resets_at).toLocaleString(dateLocaleMap[lang]),
                })
              : t.errors.serviceErrorDesc),
        });
        return false;
      }
      return true;
    } catch {
      // If quota check fails, allow generation (backend will enforce)
      return true;
    }
  }, [quota?.resets_at]);

  return (
    <QuotaContext.Provider
      value={{
        quota: quota || null,
        isLoading,
        error,
        refreshQuota,
        checkBeforeGenerate,
      }}
    >
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota(): QuotaContextType {
  const context = useContext(QuotaContext);
  if (!context) {
    throw new Error("useQuota must be used within a QuotaProvider");
  }
  return context;
}
