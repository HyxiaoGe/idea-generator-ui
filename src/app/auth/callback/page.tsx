"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSetter } from "@/lib/auth/auth-context";
import { toast } from "sonner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthToken } = useAuthSetter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setError("缺少授权参数");
      return;
    }

    // Verify state matches
    const savedState = sessionStorage.getItem("oauth_state");
    if (savedState && savedState !== state) {
      setError("授权状态不匹配，请重新登录");
      return;
    }

    // Exchange code for token via our API route
    fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "登录失败");
        }
        return res.json();
      })
      .then((data) => {
        // Store token and user
        setAuthToken(data.access_token, data.user);
        sessionStorage.removeItem("oauth_state");
        toast.success("登录成功！");
        router.replace("/");
      })
      .catch((err) => {
        setError(err.message || "登录失败，请重试");
      });
  }, [searchParams, setAuthToken, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="bg-surface w-full max-w-md rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="text-text-primary mb-2 text-xl font-semibold">登录失败</h2>
          <p className="text-text-secondary mb-6 text-sm">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-6 py-2 text-white"
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
