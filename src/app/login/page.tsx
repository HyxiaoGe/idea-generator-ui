"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { ImageIcon } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="border-primary-start h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="border-border bg-surface rounded-2xl border p-8 text-center shadow-xl">
          {/* Logo */}
          <div className="from-primary-start to-primary-end shadow-primary-start/30 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
            <ImageIcon className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-text-primary mb-2 text-2xl font-semibold">AI 创作工坊</h1>
          <p className="text-text-secondary mb-8 text-sm">登录账号，开始 AI 创作之旅</p>

          <Button
            onClick={login}
            className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 w-full rounded-xl bg-gradient-to-r py-6 text-base"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            使用 GitHub 登录
          </Button>

          <p className="text-text-secondary mt-6 text-xs">
            登录即表示你同意我们的服务条款和隐私政策
          </p>
        </div>
      </motion.div>
    </div>
  );
}
