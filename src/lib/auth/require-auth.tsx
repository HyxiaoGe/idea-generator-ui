"use client";

import { ReactNode } from "react";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          <p className="text-text-secondary text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="border-border bg-surface flex min-h-[500px] flex-col items-center justify-center rounded-2xl border p-12">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
          <LogIn className="h-12 w-12 text-[#7C3AED]" />
        </div>
        <h2 className="text-text-primary mb-2 text-2xl font-semibold">请先登录</h2>
        <p className="text-text-secondary mb-8 text-center text-sm">
          登录后即可使用所有 AI 创作功能
        </p>
        <Button
          onClick={login}
          className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-8 py-3 hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
        >
          <LogIn className="mr-2 h-4 w-4" />
          使用 GitHub 登录
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
