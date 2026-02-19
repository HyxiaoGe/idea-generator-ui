"use client";

import { ReactNode } from "react";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps content that requires authentication.
 * Shows a login prompt if the user is not authenticated.
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary-start h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-text-secondary text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="border-border bg-surface flex min-h-[500px] flex-col items-center justify-center rounded-2xl border p-12">
        <div className="from-primary-start/20 to-primary-end/20 mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br">
          <LogIn className="text-primary-start h-12 w-12" />
        </div>
        <h2 className="text-text-primary mb-2 text-2xl font-semibold">{t("auth.requireLogin")}</h2>
        <p className="text-text-secondary mb-8 text-center text-sm">{t("auth.requireLoginDesc")}</p>
        <Button
          onClick={login}
          className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 rounded-xl bg-gradient-to-r px-8 py-3"
        >
          <LogIn className="mr-2 h-4 w-4" />
          {t("common.login")}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
