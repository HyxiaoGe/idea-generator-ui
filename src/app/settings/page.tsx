"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Key,
  TrendingUp,
  Settings as SettingsIcon,
  Loader2,
  User,
  Moon,
  Sun,
  Bell,
  Volume2,
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
import { getApiClient, ApiError } from "@/lib/api-client";
import type {
  APIKeyInfo,
  GetPreferencesResponse,
  UpdatePreferencesRequest,
  Language,
  Resolution,
} from "@/lib/types";
import useSWR from "swr";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleThemeWithAnimation } = useTheme();
  const { user, logout } = useAuth();
  const { quota } = useQuota();
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Settings state
  const [resolution, setResolution] = useState("1024");
  const [language, setLanguage] = useState<Language>("zh-CN");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableSound, setEnableSound] = useState(true);

  // Fetch API keys
  const { data: apiKeys, mutate: mutateApiKeys } = useSWR<APIKeyInfo[]>("/auth/api-keys");

  // Fetch preferences from API
  const { data: prefsData } = useSWR<GetPreferencesResponse>("/preferences");

  // Populate controlled state from API data
  useEffect(() => {
    if (prefsData) {
      const { ui, notifications, generation } = prefsData.preferences;
      if (generation.default_resolution) {
        const resMap: Record<string, string> = { "1K": "1024", "2K": "2048", "4K": "4096" };
        setResolution(resMap[generation.default_resolution] || "1024");
      }
      if (ui.language) setLanguage(ui.language);
      setEnableNotifications(notifications.enabled ?? true);
      setEnableSound(notifications.sound ?? false);
    }
  }, [prefsData]);

  const savePreference = useCallback(async (update: UpdatePreferencesRequest["preferences"]) => {
    try {
      const api = getApiClient();
      await api.updatePreferences({ preferences: update });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toast.error("偏好服务暂不可用", { description: "后端尚未启用此功能" });
      } else {
        toast.error("保存设置失败");
      }
    }
  }, []);

  const quotaPercentage = quota ? (quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0) : 0;

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

  const handleResolutionChange = (value: string) => {
    setResolution(value);
    const resMap: Record<string, Resolution> = {
      "512": "1K",
      "1024": "1K",
      "2048": "2K",
      "4096": "4K",
    };
    savePreference({ generation: { default_resolution: resMap[value] || "1K" } });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
    savePreference({ ui: { language: value as Language } });
  };

  const handleNotificationsChange = (checked: boolean) => {
    setEnableNotifications(checked);
    savePreference({ notifications: { enabled: checked } });
  };

  const handleSoundChange = (checked: boolean) => {
    setEnableSound(checked);
    savePreference({ notifications: { sound: checked } });
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
            <User className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">账户</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="ring-primary-start/20 h-20 w-20 ring-2">
                <AvatarImage
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.login || "default"}`
                  }
                />
                <AvatarFallback className="from-primary-start to-primary-end bg-gradient-to-br">
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
            <Key className="text-primary-start h-5 w-5" />
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
                className="border-border bg-surface-elevated focus:border-primary-start focus:ring-primary-start/20 flex-1 rounded-xl focus:ring-2"
              />
              <Button
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !newKeyName.trim()}
                className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 rounded-xl bg-gradient-to-r"
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
            <TrendingUp className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">配额使用</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-text-secondary text-sm">今日配额</span>
                <span className="text-text-primary text-sm font-medium">
                  {quota ? `${quota.used} / ${quota.limit}` : "加载中..."}
                </span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
              <div className="mt-2 flex items-center justify-between">
                {quota?.resets_at && (
                  <p className="text-text-secondary text-xs">
                    将于 {new Date(quota.resets_at).toLocaleString("zh-CN")} 重置
                  </p>
                )}
                {quota?.cooldown_active && (
                  <p className="text-warning text-xs">
                    冷却中（剩余 {quota.cooldown_remaining}秒）
                  </p>
                )}
              </div>
            </div>

            {quota && (
              <div className="border-border bg-surface-secondary grid gap-4 rounded-xl border p-4 md:grid-cols-3">
                <div>
                  <p className="text-text-secondary text-sm">已使用</p>
                  <p className="text-text-primary text-2xl font-semibold">{quota.used}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">剩余</p>
                  <p className="text-accent text-2xl font-semibold">{quota.remaining}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">每日上限</p>
                  <p className="text-text-primary text-2xl font-semibold">{quota.limit}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <SettingsIcon className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">偏好设置</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="default-resolution" className="text-text-secondary mb-2">
                默认分辨率
              </Label>
              <Select value={resolution} onValueChange={handleResolutionChange}>
                <SelectTrigger
                  id="default-resolution"
                  className="border-border bg-surface-secondary focus:border-primary-start focus:ring-primary-start/20 rounded-xl focus:ring-2"
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
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger
                  id="language"
                  className="border-border bg-surface-secondary focus:border-primary-start focus:ring-primary-start/20 rounded-xl focus:ring-2"
                >
                  <SelectValue placeholder="简体中文" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>

                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
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
                className="data-[state=checked]:bg-primary-start"
              />
            </div>

            <div className="border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Bell className="text-text-secondary h-5 w-5" />
                <div>
                  <p className="text-text-primary font-medium">通知提醒</p>
                  <p className="text-text-secondary text-xs">生成完成时发送通知</p>
                </div>
              </div>
              <Switch
                checked={enableNotifications}
                onCheckedChange={handleNotificationsChange}
                className="data-[state=checked]:bg-primary-start"
              />
            </div>

            <div className="border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="text-text-secondary h-5 w-5" />
                <div>
                  <p className="text-text-primary font-medium">声音提示</p>
                  <p className="text-text-secondary text-xs">操作完成时播放提示音</p>
                </div>
              </div>
              <Switch
                checked={enableSound}
                onCheckedChange={handleSoundChange}
                className="data-[state=checked]:bg-primary-start"
              />
            </div>
          </div>
        </div>

        {/* Developer Documentation Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <BookOpen className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">开发文档</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => router.push("/design-system")}
              className="group border-border bg-surface-secondary hover:bg-surface hover:border-primary-start rounded-xl border p-6 text-left transition-all"
            >
              <div className="from-primary-start to-primary-end mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary group-hover:text-primary-start mb-2 font-semibold">
                设计系统
              </h3>
              <p className="text-text-secondary text-sm">颜色、字体、间距等设计规范</p>
            </button>

            <button
              onClick={() => router.push("/components")}
              className="group border-border bg-surface-secondary hover:bg-surface hover:border-primary-start rounded-xl border p-6 text-left transition-all"
            >
              <div className="from-primary-start to-primary-end mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary group-hover:text-primary-start mb-2 font-semibold">
                组件库
              </h3>
              <p className="text-text-secondary text-sm">所有可复用组件及其变体</p>
            </button>

            <button
              onClick={() => router.push("/pages-overview")}
              className="group border-border bg-surface-secondary hover:bg-surface hover:border-primary-start rounded-xl border p-6 text-left transition-all"
            >
              <div className="from-primary-start to-primary-end mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary group-hover:text-primary-start mb-2 font-semibold">
                页面总览
              </h3>
              <p className="text-text-secondary text-sm">完整的页面结构和用户流程</p>
            </button>
          </div>

          <div className="border-accent/30 bg-accent/10 mt-6 rounded-xl border p-4">
            <p className="text-accent text-sm">
              这些文档页面专为开发交接准备，包含完整的设计规范和组件说明
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-text-secondary text-center text-sm">
          <p>AI 创作工坊 v1.0.0</p>
          <p className="mt-1">&copy; 2026 保留所有权利</p>
        </div>
      </div>
    </RequireAuth>
  );
}
