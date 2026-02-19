"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSetter } from "@/lib/auth/auth-context";
import { exchangeCode } from "@/lib/auth/auth-client";
import { useTranslation, getTranslations } from "@/lib/i18n";
import { toast } from "sonner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthTokens } = useAuthSetter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const tr = getTranslations();

    if (!code) {
      setError(tr.auth.missingAuthParam);
      return;
    }

    exchangeCode(code)
      .then(async (tokens) => {
        await setAuthTokens(tokens);
        toast.success(getTranslations().auth.loginSuccess);
        router.replace("/");
      })
      .catch((err) => {
        setError(err.message || getTranslations().auth.loginFailed);
      });
  }, [searchParams, setAuthTokens, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="bg-surface w-full max-w-md rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="text-text-primary mb-2 text-xl font-semibold">{t("auth.loginFailed")}</h2>
          <p className="text-text-secondary mb-6 text-sm">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="from-primary-start to-primary-end rounded-xl bg-gradient-to-r px-6 py-2 text-white"
          >
            {t("auth.returnToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary-start h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-text-secondary text-sm">{t("auth.loggingIn")}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="border-primary-start h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
