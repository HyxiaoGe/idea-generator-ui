"use client";

import { useState } from "react";
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

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleThemeWithAnimation } = useTheme();
  const [apiKey, setApiKey] = useState("sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx");
  const [apiStatus, setApiStatus] = useState<"verified" | "error" | null>("verified");
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Mock quota data
  const quota = {
    used: 327,
    total: 1000,
    percentage: 32.7,
    dailyUsage: [45, 52, 38, 61, 55, 48, 52], // Last 7 days
    estimatedDepletion: "2月15日",
  };

  const handleVerifyApiKey = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      setApiStatus("verified");
      toast.success("API 密钥验证成功！", {
        icon: <Check className="h-4 w-4 text-[#10B981]" />,
      });
    }, 1500);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      toast.success("连接测试成功", {
        icon: <Check className="h-4 w-4 text-[#10B981]" />,
      });
    }, 1500);
  };

  const handleLogout = () => {
    toast.success("已成功退出登录");
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

  const maxUsage = Math.max(...quota.dailyUsage);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <BackButton onClick={() => router.push("/")} />
        <h1 className="text-3xl font-semibold text-text-primary">设置</h1>
      </div>

      {/* Account Section */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-xl font-semibold text-text-primary">账户</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 ring-2 ring-[#7C3AED]/20">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
              <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#2563EB]">
                <User className="h-10 w-10 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border bg-surface-elevated hover:bg-surface"
              >
                更换头像
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="username" className="mb-2 text-text-secondary">
                用户名
              </Label>
              <Input
                id="username"
                defaultValue="john_doe"
                className="rounded-xl border-border bg-surface-elevated focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2 text-text-secondary">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.doe@example.com"
                className="rounded-xl border-border bg-surface-elevated focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <div className="flex justify-between border-t border-border pt-6">
            <div>
              <p className="text-sm text-text-secondary">注册时间</p>
              <p className="text-sm font-medium text-text-primary">2026年1月</p>
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

      {/* API Configuration Section */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <Key className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-xl font-semibold text-text-primary">API 配置</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key" className="mb-2 text-text-secondary">
              API 密钥
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="rounded-xl border-border bg-surface-elevated pr-10 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
                {apiStatus === "verified" && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10B981]" />
                )}
                {apiStatus === "error" && (
                  <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                )}
              </div>
              <Button
                onClick={handleVerifyApiKey}
                disabled={isTestingConnection}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    验证中...
                  </>
                ) : (
                  "验证"
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              您的 API 密钥已加密并安全存储。请勿与他人分享您的 API 密钥。
            </p>
          </div>

          {apiStatus === "verified" && (
            <div className="flex items-center justify-between rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">API 密钥已验证并激活</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="text-[#10B981] hover:bg-[#10B981]/20"
              >
                {isTestingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "测试连接"
                )}
              </Button>
            </div>
          )}

          {apiStatus === "error" && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-400">API 密钥验证失败，请检查后重试</span>
            </div>
          )}
        </div>
      </div>

      {/* Quota Usage Section */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-xl font-semibold text-text-primary">配额使用</h2>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-text-secondary">每日生成</span>
              <span className="text-sm font-medium text-text-primary">
                {quota.used} / {quota.total}
              </span>
            </div>
            <Progress value={quota.percentage} className="h-2" />
            <p className="mt-2 text-xs text-text-secondary">按当前速度，预计 {quota.estimatedDepletion} 耗尽</p>
          </div>

          {/* Mini Usage Chart */}
          <div>
            <p className="mb-3 text-sm text-text-secondary">最近 7 天使用趋势</p>
            <div className="flex h-[60px] items-end gap-1">
              {quota.dailyUsage.map((usage, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#7C3AED] to-[#2563EB] transition-all hover:opacity-80"
                    style={{ height: `${(usage / maxUsage) * 100}%` }}
                  />
                  <span className="text-[10px] text-text-secondary">
                    {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-surface-secondary p-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-text-secondary">本月</p>
              <p className="text-2xl font-semibold text-text-primary">327</p>
              <p className="text-xs text-text-secondary">次生成</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">总计</p>
              <p className="text-2xl font-semibold text-text-primary">1,842</p>
              <p className="text-xs text-text-secondary">次生成</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">套餐</p>
              <p className="text-2xl font-semibold text-[#10B981]">专业版</p>
              <p className="text-xs text-text-secondary">订阅</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20"
          >
            <Zap className="mr-2 h-4 w-4" />
            升级套餐
          </Button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-xl font-semibold text-text-primary">偏好设置</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="default-resolution" className="mb-2 text-text-secondary">
              默认分辨率
            </Label>
            <Select defaultValue="1024">
              <SelectTrigger
                id="default-resolution"
                className="rounded-xl border-border bg-surface-secondary focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
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
            <Label htmlFor="language" className="mb-2 text-text-secondary">
              语言
            </Label>
            <Select defaultValue="zh-CN">
              <SelectTrigger
                id="language"
                className="rounded-xl border-border bg-surface-secondary focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
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

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-text-secondary" />
              ) : (
                <Sun className="h-5 w-5 text-text-secondary" />
              )}
              <div>
                <p className="font-medium text-text-primary">深色模式</p>
                <p className="text-xs text-text-secondary">在浅色和深色主题之间切换</p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={handleThemeChange}
              className="data-[state=checked]:bg-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="font-medium text-text-primary">自动保存生成结果</p>
                <p className="text-xs text-text-secondary">自动保存所有生成的内容</p>
              </div>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-[#7C3AED]" />
          </div>
        </div>
      </div>

      {/* Developer Documentation Section */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-xl font-semibold text-text-primary">开发文档</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => router.push("/design-system")}
            className="group rounded-xl border border-border bg-surface-secondary p-6 text-left transition-all hover:border-[#7C3AED] hover:bg-surface"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
              <Layout className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-text-primary group-hover:text-[#7C3AED]">
              设计系统
            </h3>
            <p className="text-sm text-text-secondary">
              颜色、字体、间距等设计规范
            </p>
          </button>

          <button
            onClick={() => router.push("/components")}
            className="group rounded-xl border border-border bg-surface-secondary p-6 text-left transition-all hover:border-[#7C3AED] hover:bg-surface"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-text-primary group-hover:text-[#7C3AED]">
              组件库
            </h3>
            <p className="text-sm text-text-secondary">
              所有可复用组件及其变体
            </p>
          </button>

          <button
            onClick={() => router.push("/pages-overview")}
            className="group rounded-xl border border-border bg-surface-secondary p-6 text-left transition-all hover:border-[#7C3AED] hover:bg-surface"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-text-primary group-hover:text-[#7C3AED]">
              页面总览
            </h3>
            <p className="text-sm text-text-secondary">
              完整的页面结构和用户流程
            </p>
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4">
          <p className="text-sm text-[#10B981]">
            这些文档页面专为开发交接准备，包含完整的设计规范和组件说明
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-text-secondary">
        <p>AI 创作工坊 v1.0.0</p>
        <p className="mt-1">© 2026 保留所有权利</p>
      </div>
    </div>
  );
}
