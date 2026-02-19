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
import { useTranslation, dateLocaleMap } from "@/lib/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleThemeWithAnimation } = useTheme();
  const { user, logout } = useAuth();
  const { quota } = useQuota();
  const { t, language: currentLanguage, changeLanguage } = useTranslation();
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
        toast.error(t("settings.prefServiceUnavailable"), {
          description: t("settings.prefServiceUnavailableDesc"),
        });
      } else {
        toast.error(t("settings.saveSettingsFailed"));
      }
    }
  }, []);

  const quotaPercentage = quota ? (quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0) : 0;

  const handleCreateApiKey = useCallback(async () => {
    if (!newKeyName.trim()) {
      toast.error(t("settings.enterKeyName"));
      return;
    }
    setIsCreatingKey(true);
    try {
      const api = getApiClient();
      const result = await api.createApiKey(newKeyName.trim());
      toast.success(t("settings.keyCreated"), {
        description: t("settings.keyCreatedDesc", { key: result.key }),
        duration: 10000,
      });
      setNewKeyName("");
      mutateApiKeys();
    } catch (error) {
      toast.error(t("settings.createFailed"), {
        description: error instanceof Error ? error.message : t("common.retry"),
      });
    }
    setIsCreatingKey(false);
  }, [newKeyName, mutateApiKeys]);

  const handleDeleteApiKey = useCallback(
    async (id: string) => {
      try {
        const api = getApiClient();
        await api.deleteApiKey(id);
        toast.success(t("settings.keyDeleted"));
        mutateApiKeys();
      } catch {
        toast.error(t("settings.deleteFailed"));
      }
    },
    [mutateApiKeys]
  );

  const handleLogout = () => {
    logout();
    toast.success(t("auth.logoutSuccess"));
    router.push("/");
  };

  const handleThemeChange = (checked: boolean) => {
    toggleThemeWithAnimation({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    toast.success(checked ? t("nav.switchedToDark") : t("nav.switchedToLight"), {
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
    const lang = value as Language;
    setLanguage(lang);
    changeLanguage(lang);
    savePreference({ ui: { language: lang } });
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
          <h1 className="text-text-primary text-3xl font-semibold">{t("settings.title")}</h1>
        </div>

        {/* Account Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <User className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">{t("settings.account")}</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="ring-primary-start/20 h-20 w-20 ring-2">
                <AvatarImage
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "default"}`
                  }
                />
                <AvatarFallback className="from-primary-start to-primary-end bg-gradient-to-br">
                  <User className="h-10 w-10 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-text-primary text-lg font-semibold">
                  {user?.name || user?.email || t("common.user")}
                </p>
                {user?.email && <p className="text-text-secondary text-sm">{user.email}</p>}
                <p className="text-text-secondary mt-1 text-xs">{user?.email}</p>
              </div>
            </div>

            <div className="border-border flex justify-between border-t pt-6">
              <div>
                <p className="text-text-secondary text-sm">{t("auth.loginMethod")}</p>
                <p className="text-text-primary text-sm font-medium">OAuth</p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <Key className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">{t("settings.apiKeys")}</h2>
          </div>

          <div className="space-y-4">
            {/* Create new key */}
            <div className="flex gap-2">
              <Input
                placeholder={t("settings.keyNamePlaceholder")}
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
                {t("settings.createKey")}
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
                            {t("settings.expired")}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs">
                        {key.key_prefix}... ·{" "}
                        {t("settings.createdAt", {
                          date: new Date(key.created_at).toLocaleDateString(
                            dateLocaleMap[currentLanguage]
                          ),
                        })}
                        {key.last_used_at && (
                          <>
                            {" "}
                            ·{" "}
                            {t("settings.lastUsed", {
                              date: new Date(key.last_used_at).toLocaleDateString(
                                dateLocaleMap[currentLanguage]
                              ),
                            })}
                          </>
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
              <p className="text-text-secondary py-4 text-center text-sm">
                {t("settings.noApiKeys")}
              </p>
            )}

            <p className="text-text-secondary text-xs">{t("settings.apiKeyNotice")}</p>
          </div>
        </div>

        {/* Quota Usage Section */}
        <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary-start h-5 w-5" />
            <h2 className="text-text-primary text-xl font-semibold">{t("settings.quotaUsage")}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-text-secondary text-sm">{t("settings.todayQuota")}</span>
                <span className="text-text-primary text-sm font-medium">
                  {quota ? `${quota.used} / ${quota.limit}` : t("settings.quotaLoading")}
                </span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
              <div className="mt-2 flex items-center justify-between">
                {quota?.resets_at && (
                  <p className="text-text-secondary text-xs">
                    {t("settings.resetsAt", {
                      date: new Date(quota.resets_at).toLocaleString(
                        dateLocaleMap[currentLanguage]
                      ),
                    })}
                  </p>
                )}
                {quota?.cooldown_active && (
                  <p className="text-warning text-xs">
                    {t("settings.cooldownActive", { seconds: quota.cooldown_remaining })}
                  </p>
                )}
              </div>
            </div>

            {quota && (
              <div className="border-border bg-surface-secondary grid gap-4 rounded-xl border p-4 md:grid-cols-3">
                <div>
                  <p className="text-text-secondary text-sm">{t("settings.used")}</p>
                  <p className="text-text-primary text-2xl font-semibold">{quota.used}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">{t("settings.remaining")}</p>
                  <p className="text-accent text-2xl font-semibold">{quota.remaining}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">{t("settings.dailyLimit")}</p>
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
            <h2 className="text-text-primary text-xl font-semibold">{t("settings.preferences")}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="default-resolution" className="text-text-secondary mb-2">
                {t("settings.defaultResolution")}
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
                {t("settings.language")}
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
                  <p className="text-text-primary font-medium">{t("settings.darkMode")}</p>
                  <p className="text-text-secondary text-xs">{t("settings.darkModeDesc")}</p>
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
                  <p className="text-text-primary font-medium">{t("settings.notifications")}</p>
                  <p className="text-text-secondary text-xs">{t("settings.notificationsDesc")}</p>
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
                  <p className="text-text-primary font-medium">{t("settings.sound")}</p>
                  <p className="text-text-secondary text-xs">{t("settings.soundDesc")}</p>
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
            <h2 className="text-text-primary text-xl font-semibold">{t("settings.devDocs")}</h2>
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
                {t("settings.designSystem")}
              </h3>
              <p className="text-text-secondary text-sm">{t("settings.designSystemDesc")}</p>
            </button>

            <button
              onClick={() => router.push("/components")}
              className="group border-border bg-surface-secondary hover:bg-surface hover:border-primary-start rounded-xl border p-6 text-left transition-all"
            >
              <div className="from-primary-start to-primary-end mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary group-hover:text-primary-start mb-2 font-semibold">
                {t("settings.componentLibrary")}
              </h3>
              <p className="text-text-secondary text-sm">{t("settings.componentLibraryDesc")}</p>
            </button>

            <button
              onClick={() => router.push("/pages-overview")}
              className="group border-border bg-surface-secondary hover:bg-surface hover:border-primary-start rounded-xl border p-6 text-left transition-all"
            >
              <div className="from-primary-start to-primary-end mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-text-primary group-hover:text-primary-start mb-2 font-semibold">
                {t("settings.pagesOverview")}
              </h3>
              <p className="text-text-secondary text-sm">{t("settings.pagesOverviewDesc")}</p>
            </button>
          </div>

          <div className="border-accent/30 bg-accent/10 mt-6 rounded-xl border p-4">
            <p className="text-accent text-sm">{t("settings.devDocsNotice")}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-text-secondary text-center text-sm">
          <p>{t("settings.version")}</p>
          <p className="mt-1">{t("settings.copyright")}</p>
        </div>
      </div>
    </RequireAuth>
  );
}
