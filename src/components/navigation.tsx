"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ImageIcon,
  Video,
  Folder,
  BookTemplate,
  Sun,
  Moon,
  LogIn,
  Menu,
} from "lucide-react";
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
import { useAuth } from "@/lib/auth/auth-context";
import { useQuota } from "@/lib/quota/quota-context";
import { toast } from "sonner";
import { motion } from "motion/react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleThemeWithAnimation } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { quota: quotaData } = useQuota();

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

  // Compute quota display from real data or fallback
  const quota = quotaData
    ? {
        used: quotaData.used,
        total: quotaData.limit,
        percentage: quotaData.limit > 0 ? (quotaData.used / quotaData.limit) * 100 : 0,
      }
    : { used: 0, total: 0, percentage: 0 };

  const getQuotaColor = () => {
    if (quota.percentage > 95) return "bg-red-500";
    if (quota.percentage > 80) return "bg-orange-500";
    return "bg-gradient-to-r from-primary-start to-primary-end";
  };

  const isSettingsActive =
    pathname === "/settings" ||
    pathname === "/design-system" ||
    pathname === "/components" ||
    pathname === "/pages-overview";

  const handleLogout = () => {
    logout();
    toast.success("已退出登录");
    router.push("/");
  };

  return (
    <nav className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-2xl transition-colors">
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
            className="from-primary-start to-primary-end shadow-primary-start/25 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
            }}
          >
            <ImageIcon className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-text-primary group-hover:from-primary-start group-hover:to-primary-end text-lg font-semibold transition-colors group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent">
            AI 创作工坊
          </span>
        </motion.button>

        {/* Center: Content Type Tabs (only on home page) */}
        {isHomePage && (
          <div className="bg-surface flex items-center gap-1 rounded-xl p-1 shadow-sm">
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
                  className="from-primary-start to-primary-end shadow-primary-start/30 absolute inset-0 rounded-lg bg-gradient-to-r shadow-lg"
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
                  className="from-primary-start to-primary-end shadow-primary-start/30 absolute inset-0 rounded-lg bg-gradient-to-r shadow-lg"
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
          {/* Desktop nav items — hidden below md */}
          <div className="hidden md:flex md:items-center md:gap-2">
            {/* Gallery Button */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                onClick={() => handleNavigate("/gallery")}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ${
                  pathname === "/gallery"
                    ? "from-primary-start/15 to-primary-end/15 text-primary-start shadow-primary-start/10 bg-gradient-to-r shadow-md"
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
                    className="from-primary-start to-primary-end shadow-primary-start/50 absolute right-0 -bottom-px left-0 h-0.5 bg-gradient-to-r shadow-sm"
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
                    ? "from-primary-start/15 to-primary-end/15 text-primary-start shadow-primary-start/10 bg-gradient-to-r shadow-md"
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
                    className="from-primary-start to-primary-end shadow-primary-start/50 absolute right-0 -bottom-px left-0 h-0.5 bg-gradient-to-r shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Button>
            </motion.div>

            {/* Divider */}
            <div className="bg-border mx-1 h-6 w-px" />

            {/* Theme Toggle Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="group text-text-secondary hover:bg-surface-secondary hover:text-text-primary relative rounded-lg transition-all"
                aria-label={
                  !mounted ? "切换主题" : theme === "dark" ? "切换到浅色模式" : "切换到深色模式"
                }
                title={
                  !mounted ? "切换主题" : theme === "dark" ? "切换到浅色模式" : "切换到深色模式"
                }
              >
                {mounted ? (
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
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                {mounted && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      background:
                        theme === "dark"
                          ? "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)"
                          : "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",
                    }}
                  />
                )}
              </Button>
            </motion.div>

            {/* Settings Icon */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate("/settings")}
                aria-label="设置"
                className={`group relative rounded-lg transition-all duration-200 ${
                  isSettingsActive
                    ? "from-primary-start/15 to-primary-end/15 text-primary-start shadow-primary-start/10 bg-gradient-to-r shadow-md"
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
                    className="ring-primary-start/30 pointer-events-none absolute inset-0 rounded-lg ring-2"
                  />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Mobile hamburger — visible below md */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="菜单">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleNavigate("/gallery")}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  画廊
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleNavigate("/templates")}
                >
                  <BookTemplate className="mr-2 h-4 w-4" />
                  模板
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    toggleThemeWithAnimation({ x: window.innerWidth - 40, y: 32 });
                    toast.success(theme === "dark" ? "已切换到浅色模式" : "已切换到深色模式", {
                      duration: 2000,
                    });
                  }}
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  切换主题
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleNavigate("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quota Progress + Avatar (or Login button) */}
          <div className="flex items-center gap-3 pl-2">
            {isAuthenticated && quotaData && (
              /* Quota Indicator */
              <div>
                <div className="group relative">
                  <div className="bg-surface-elevated mb-1 h-1.5 w-20 overflow-hidden rounded-full shadow-inner">
                    <motion.div
                      className={`h-full transition-all duration-500 ${getQuotaColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(quota.percentage, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-text-secondary group-hover:text-text-primary text-xs font-medium transition-colors">
                    {quota.used}/{quota.total}
                  </div>
                </div>
              </div>
            )}

            {isAuthenticated && user ? (
              /* User Avatar Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="focus:outline-none"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="ring-border hover:shadow-primary-start/20 hover:ring-primary-start h-9 w-9 cursor-pointer ring-2 transition-all duration-300 hover:shadow-lg">
                      <AvatarImage
                        src={
                          user.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.login}`
                        }
                      />
                      <AvatarFallback className="from-primary-start to-primary-end bg-gradient-to-br text-white">
                        {(user.name || user.login || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="border-border bg-surface w-56 shadow-xl"
                  align="end"
                >
                  <DropdownMenuLabel className="text-text-primary">
                    <div className="flex flex-col">
                      <span>{user.name || user.login}</span>
                      {user.email && (
                        <span className="text-text-secondary text-xs font-normal">
                          {user.email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />

                  <DropdownMenuItem
                    className="text-text-secondary focus:bg-surface-elevated focus:text-text-primary cursor-pointer"
                    onClick={() => handleNavigate("/gallery")}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    画廊
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-text-secondary focus:bg-surface-elevated focus:text-text-primary cursor-pointer"
                    onClick={() => handleNavigate("/templates")}
                  >
                    <BookTemplate className="mr-2 h-4 w-4" />
                    模板
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-text-secondary focus:bg-surface-elevated focus:text-text-primary cursor-pointer"
                    onClick={() => handleNavigate("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    onClick={handleLogout}
                  >
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Login Button */
              <Button
                variant="ghost"
                onClick={() => login()}
                className="text-text-secondary hover:bg-surface-secondary hover:text-text-primary flex items-center gap-2 rounded-lg"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">登录</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
