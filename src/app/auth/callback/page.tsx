"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSetter } from "@/lib/auth/auth-context";
import { exchangeCode } from "@/lib/auth/auth-client";
import { toast } from "sonner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthTokens } = useAuthSetter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("缺少授权参数");
      return;
    }

    exchangeCode(code)
      .then(async (tokens) => {
        await setAuthTokens(tokens);
        toast.success("登录成功！");
        router.replace("/");
      })
      .catch((err) => {
        setError(err.message || "登录失败，请重试");
      });
  }, [searchParams, setAuthTokens, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="bg-surface w-full max-w-md rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="text-text-primary mb-2 text-xl font-semibold">登录失败</h2>
          <p className="text-text-secondary mb-6 text-sm">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="from-primary-start to-primary-end rounded-xl bg-gradient-to-r px-6 py-2 text-white"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary-start h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-text-secondary text-sm">正在完成登录...</p>
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
