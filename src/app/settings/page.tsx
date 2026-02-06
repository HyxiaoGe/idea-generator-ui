"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Key,
  TrendingUp,
  Settings as SettingsIcon,
  Check,
  X,
  Loader2,
  User,
  Zap,
  Moon,
  Sun,
  Monitor,
  BookOpen,
  Layout,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuota } from "@/lib/quota/quota-context";
import { RequireAuth } from "@/lib/auth/require-auth";
import { getApiClient } from "@/lib/api-client";
import type { APIKeyInfo } from "@/lib/types";
import useSWR from "swr";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleThemeWithAnimation } = useTheme();
  const { user, logout } = useAuth();
  const { quota } = useQuota();
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Fetch API keys
  const { data: apiKeys, mutate: mutateApiKeys } = useSWR<APIKeyInfo[]>("/auth/api-keys");

  const quotaPercentage = quota
    ? quota.global_limit > 0
      ? (quota.global_used / quota.global_limit) * 100
      : 0
    : 0;

  const handleCreateApiKey = useCallback(async () => {
    if (!newKeyName.trim()) {
      toast.error("请输入密钥名称");
      return;
    }
    setIsCreatingKey(true);
    try {
      const api = getApiClient();
      const result = await api.createApiKey(newKeyName.trim());
      toast.success("API 密钥创建成功", {
        description: `密钥: ${result.key}（请立即保存，此密钥不会再次显示）`,
        duration: 10000,
      });
      setNewKeyName("");
      mutateApiKeys();
    } catch (error) {
      toast.error("创建失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    }
    setIsCreatingKey(false);
  }, [newKeyName, mutateApiKeys]);

  const handleDeleteApiKey = useCallback(
    async (id: string) => {
      try {
        const api = getApiClient();
        await api.deleteApiKey(id);
        toast.success("已删除 API 密钥");
        mutateApiKeys();
      } catch {
        toast.error("删除失败");
      }
    },
    [mutateApiKeys]
  );

  const handleLogout = () => {
    logout();
    toast.success("已成功退出登录");
    router.push("/");
  };

  const handleThemeChange = (checked: boolean) => {
    toggleThemeWithAnimation({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    toast.success(checked ? "已切换到深色模式" : "已切换到浅色模式", {
      duration: 2000,
    });
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <BackButton onClick={() => router.push("/")} />
          <h1 className="text-text-primary text-3xl font-semibold">设置</h1>
        </div>

        {/* Account Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-text-primary text-xl font-semibold">账户</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 ring-2 ring-[#7C3AED]/20">
                <AvatarImage
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.login || "default"}`
                  }
                />
                <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#2563EB]">
                  <User className="h-10 w-10 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-text-primary text-lg font-semibold">
                  {user?.name || user?.login || "用户"}
                </p>
                {user?.email && <p className="text-text-secondary text-sm">{user.email}</p>}
                <p className="text-text-secondary mt-1 text-xs">GitHub: @{user?.login}</p>
              </div>
            </div>

            <div className="border-border flex justify-between border-t pt-6">
              <div>
                <p className="text-text-secondary text-sm">登录方式</p>
                <p className="text-text-primary text-sm font-medium">GitHub OAuth</p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <Key className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-text-primary text-xl font-semibold">API 密钥</h2>
          </div>

          <div className="space-y-4">
            {/* Create new key */}
            <div className="flex gap-2">
              <Input
                placeholder="密钥名称（如：开发环境）"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateApiKey()}
                className="border-border bg-surface-elevated flex-1 rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <Button
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !newKeyName.trim()}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
              >
                {isCreatingKey ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                创建密钥
              </Button>
            </div>

            {/* Existing keys */}
            {apiKeys && apiKeys.length > 0 ? (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-text-primary text-sm font-medium">{key.name}</p>
                        {key.is_expired && (
                          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                            已过期
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs">
                        {key.key_prefix}... · 创建于{" "}
                        {new Date(key.created_at).toLocaleDateString("zh-CN")}
                        {key.last_used_at && (
                          <> · 最后使用 {new Date(key.last_used_at).toLocaleDateString("zh-CN")}</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary py-4 text-center text-sm">还没有 API 密钥</p>
            )}

            <p className="text-text-secondary text-xs">
              API 密钥用于程序化访问。请勿与他人分享您的密钥。
            </p>
          </div>
        </div>

        {/* Quota Usage Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-text-primary text-xl font-semibold">配额使用</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-text-secondary text-sm">总配额</span>
                <span className="text-text-primary text-sm font-medium">
                  {quota ? `${quota.global_used} / ${quota.global_limit}` : "加载中..."}
                </span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
              {quota?.resets_at && (
                <p className="text-text-secondary mt-2 text-xs">
                  将于 {new Date(quota.resets_at).toLocaleString("zh-CN")} 重置
                </p>
              )}
            </div>

            {/* Mode breakdown */}
            {quota?.modes && Object.keys(quota.modes).length > 0 && (
              <div className="border-border bg-surface-secondary grid gap-4 rounded-xl border p-4 md:grid-cols-3">
                {Object.entries(quota.modes).map(([mode, modeQuota]) => (
                  <div key={mode}>
                    <p className="text-text-secondary text-sm">{modeQuota.name}</p>
                    <p className="text-text-primary text-2xl font-semibold">{modeQuota.used}</p>
                    <p className="text-text-secondary text-xs">
                      / {modeQuota.limit} · 剩余 {modeQuota.remaining}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {quota?.is_trial_mode && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20"
              >
                <Zap className="mr-2 h-4 w-4" />
                升级套餐
              </Button>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-text-primary text-xl font-semibold">偏好设置</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="default-resolution" className="text-text-secondary mb-2">
                默认分辨率
              </Label>
              <Select defaultValue="1024">
                <SelectTrigger
                  id="default-resolution"
                  className="border-border bg-surface-secondary rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                >
                  <SelectValue placeholder="1024x1024" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512x512</SelectItem>
                  <SelectItem value="1024">1024x1024</SelectItem>
                  <SelectItem value="2048">2048x2048</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language" className="text-text-secondary mb-2">
                语言
              </Label>
              <Select defaultValue="zh-CN">
                <SelectTrigger
                  id="language"
                  className="border-border bg-surface-secondary rounded-xl focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                >
                  <SelectValue placeholder="简体中文" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="text-text-secondary h-5 w-5" />
                ) : (
                  <Sun className="text-text-secondary h-5 w-5" />
                )}
                <div>
                  <p className="text-text-primary font-medium">深色模式</p>
                  <p className="text-text-secondary text-xs">在浅色和深色主题之间切换</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={handleThemeChange}
                className="data-[state=checked]:bg-[#7C3AED]"
              />
            </div>

            <div className="border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Monitor className="text-text-secondary h-5 w-5" />
                <div>
                  <p className="text-text-primary font-medium">自动保存生成结果</p>
                  <p className="text-text-secondary text-xs">自动保存所有生成的内容</p>
                </div>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#7C3AED]" />
            </div>
          </div>
        </div>

        {/* Developer Documentation Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-text-primary text-xl font-semibold">开发文档</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => router.push("/design-system")}
              className="group border-border bg-surface-secondary hover:bg-surface rounded-xl border p-6 text-left transition-all hover:border-[#7C3AED]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary mb-2 font-semibold group-hover:text-[#7C3AED]">
                设计系统
              </h3>
              <p className="text-text-secondary text-sm">颜色、字体、间距等设计规范</p>
            </button>

            <button
              onClick={() => router.push("/components")}
              className="group border-border bg-surface-secondary hover:bg-surface rounded-xl border p-6 text-left transition-all hover:border-[#7C3AED]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary mb-2 font-semibold group-hover:text-[#7C3AED]">
                组件库
              </h3>
              <p className="text-text-secondary text-sm">所有可复用组件及其变体</p>
            </button>

            <button
              onClick={() => router.push("/pages-overview")}
              className="group border-border bg-surface-secondary hover:bg-surface rounded-xl border p-6 text-left transition-all hover:border-[#7C3AED]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary mb-2 font-semibold group-hover:text-[#7C3AED]">
                页面总览
              </h3>
              <p className="text-text-secondary text-sm">完整的页面结构和用户流程</p>
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4">
            <p className="text-sm text-[#10B981]">
              这些文档页面专为开发交接准备，包含完整的设计规范和组件说明
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-text-secondary text-center text-sm">
          <p>AI 创作工坊 v1.0.0</p>
          <p className="mt-1">© 2026 保留所有权利</p>
        </div>
      </div>
    </RequireAuth>
  );
}
