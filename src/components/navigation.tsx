"use client";

import { Settings, ImageIcon, Video, Folder, BookTemplate, Sun, Moon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { toast } from "sonner";
import { motion } from "motion/react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleThemeWithAnimation } = useTheme();

  const contentType = (searchParams.get("type") as "image" | "video") || "image";
  const isHomePage = pathname === "/";

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleContentTypeChange = (type: "image" | "video") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    router.push(`/?${params.toString()}`);
  };

  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const triggerPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    toggleThemeWithAnimation(triggerPosition);

    toast.success(theme === "dark" ? "已切换到浅色模式" : "已切换到深色模式", {
      duration: 2000,
    });
  };

  const quota = {
    used: 327,
    total: 1000,
    percentage: 32.7,
  };

  const userPlan = "Pro";

  const getQuotaColor = () => {
    if (quota.percentage > 95) return "bg-red-500";
    if (quota.percentage > 80) return "bg-orange-500";
    return "bg-gradient-to-r from-[#7C3AED] to-[#2563EB]";
  };

  const isSettingsActive =
    pathname === "/settings" ||
    pathname === "/design-system" ||
    pathname === "/components" ||
    pathname === "/pages-overview";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-2xl transition-colors">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
        {/* Left: Logo */}
        <motion.button
          onClick={() => handleNavigate("/")}
          className="group flex items-center gap-3 transition-all active:scale-95"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleNavigate("/generating-demo");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] shadow-md shadow-[#7C3AED]/25 transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
            }}
          >
            <ImageIcon className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-lg font-semibold text-text-primary transition-colors group-hover:bg-gradient-to-r group-hover:from-[#7C3AED] group-hover:to-[#2563EB] group-hover:bg-clip-text group-hover:text-transparent">
            AI 创作工坊
          </span>
        </motion.button>

        {/* Center: Content Type Tabs (only on home page) */}
        {isHomePage && (
          <div className="flex items-center gap-1 rounded-xl bg-surface p-1 shadow-sm">
            <motion.button
              onClick={() => handleContentTypeChange("image")}
              className={`relative flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all duration-200 ${
                contentType === "image"
                  ? "text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              whileHover={{ scale: contentType !== "image" ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
            >
              {contentType === "image" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#2563EB] shadow-lg shadow-[#7C3AED]/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <ImageIcon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">图片生成</span>
            </motion.button>
            <motion.button
              onClick={() => handleContentTypeChange("video")}
              className={`relative flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all duration-200 ${
                contentType === "video"
                  ? "text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              whileHover={{ scale: contentType !== "video" ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
            >
              {contentType === "video" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#2563EB] shadow-lg shadow-[#7C3AED]/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Video className="relative z-10 h-4 w-4" />
              <span className="relative z-10">视频生成</span>
            </motion.button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Gallery Button */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={() => handleNavigate("/gallery")}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ${
                pathname === "/gallery"
                  ? "bg-gradient-to-r from-[#7C3AED]/15 to-[#2563EB]/15 text-[#7C3AED] shadow-md shadow-[#7C3AED]/10"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              }`}
            >
              <motion.div
                animate={
                  pathname === "/gallery"
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                <Folder className="h-4 w-4" />
              </motion.div>
              <span className="hidden sm:inline">画廊</span>
              {pathname === "/gallery" && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] shadow-sm shadow-[#7C3AED]/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          </motion.div>

          {/* Templates Button */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={() => handleNavigate("/templates")}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ${
                pathname === "/templates"
                  ? "bg-gradient-to-r from-[#7C3AED]/15 to-[#2563EB]/15 text-[#7C3AED] shadow-md shadow-[#7C3AED]/10"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              }`}
            >
              <motion.div
                animate={
                  pathname === "/templates"
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                <BookTemplate className="h-4 w-4" />
              </motion.div>
              <span className="hidden sm:inline">模板</span>
              {pathname === "/templates" && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] shadow-sm shadow-[#7C3AED]/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-border" />

          {/* Theme Toggle Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="group relative rounded-lg text-text-secondary transition-all hover:bg-surface-secondary hover:text-text-primary"
              title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 transition-all group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                ) : (
                  <Moon className="h-5 w-5 transition-all group-hover:text-indigo-400 group-hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                )}
              </motion.div>
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    theme === "dark"
                      ? "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",
                }}
              />
            </Button>
          </motion.div>

          {/* Settings Icon */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate("/settings")}
              className={`group relative rounded-lg transition-all duration-200 ${
                isSettingsActive
                  ? "bg-gradient-to-r from-[#7C3AED]/15 to-[#2563EB]/15 text-[#7C3AED] shadow-md shadow-[#7C3AED]/10"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              }`}
            >
              <motion.div
                animate={isSettingsActive ? { rotate: [0, 90, 0] } : {}}
                transition={{ duration: 0.5 }}
                whileHover={{ rotate: 90 }}
              >
                <Settings className="h-5 w-5" />
              </motion.div>
              {isSettingsActive && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#7C3AED]/30"
                />
              )}
            </Button>
          </motion.div>

          {/* Quota Progress + Avatar */}
          <div className="flex items-center gap-3 pl-2">
            {/* Quota Indicator */}
            <div className="hidden md:block">
              <div className="group relative">
                <div className="mb-1 h-1.5 w-20 overflow-hidden rounded-full bg-surface-elevated shadow-inner">
                  <motion.div
                    className={`h-full transition-all duration-500 ${getQuotaColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${quota.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="text-xs font-medium text-text-secondary transition-colors group-hover:text-text-primary">
                  {quota.used}/{quota.total}
                </div>

                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-text-primary shadow-lg transition-transform group-hover:scale-100">
                  剩余 {quota.total - quota.used} 次
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-surface-elevated" />
                </div>
              </div>
            </div>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border transition-all duration-300 hover:ring-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                    <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white">
                      U
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 border-border bg-surface shadow-xl"
                align="end"
              >
                <DropdownMenuLabel className="text-text-primary">
                  <div className="flex items-center justify-between">
                    <span>我的账户</span>
                    {userPlan === "Pro" ? (
                      <span className="rounded-md bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-2 py-0.5 text-xs text-white shadow-sm">
                        Pro
                      </span>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-text-secondary">
                        免费
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />

                {userPlan !== "Pro" && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer text-[#F59E0B] focus:bg-[#F59E0B]/10 focus:text-[#F59E0B]"
                      onClick={() => handleNavigate("/settings")}
                    >
                      <span className="mr-2">⚡</span>
                      升级套餐
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                  </>
                )}

                <DropdownMenuItem
                  className="cursor-pointer text-text-secondary focus:bg-surface-elevated focus:text-text-primary"
                  onClick={() => handleNavigate("/gallery")}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  画廊
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-text-secondary focus:bg-surface-elevated focus:text-text-primary"
                  onClick={() => handleNavigate("/templates")}
                >
                  <BookTemplate className="mr-2 h-4 w-4" />
                  模板
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-text-secondary focus:bg-surface-elevated focus:text-text-primary"
                  onClick={() => handleNavigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
