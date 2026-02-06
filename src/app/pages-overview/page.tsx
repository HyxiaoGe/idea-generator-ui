"use client";

import { motion } from "motion/react";
import {
  Home,
  MessageSquare,
  Palette,
  Blend,
  Video,
  Image as ImageIcon,
  Layout,
  Settings,
  ArrowRight,
  Sparkles,
  Film,
  FileText,
  Clock,
  LucideIcon,
} from "lucide-react";

export default function PagesOverviewPage() {
  const imageModePaths = [
    { name: "首页", icon: Home, path: "home", available: true },
    { name: "对话微调", icon: MessageSquare, path: "chat", available: true },
    { name: "风格迁移", icon: Palette, path: "style", available: true },
    { name: "图像混合", icon: Blend, path: "blend", available: true },
    { name: "图生视频", icon: Video, path: "image-to-video", available: false, label: "即将上线" },
  ];

  const videoModePaths = [
    { name: "首页", icon: Home, path: "home", available: true },
    { name: "图生视频", icon: Video, path: "image-to-video", available: true },
    { name: "脚本生成", icon: FileText, path: "script", available: false, label: "即将上线" },
    { name: "视频风格", icon: Palette, path: "video-style", available: false, label: "即将上线" },
    { name: "视频延长", icon: Clock, path: "video-extend", available: false, label: "即将上线" },
  ];

  const commonPages = [
    { name: "画廊", icon: ImageIcon, path: "gallery", available: true },
    { name: "模板", icon: Layout, path: "templates", available: true },
    { name: "设置", icon: Settings, path: "settings", available: true },
  ];

  const features = [
    { title: "8 个主要页面", description: "完整的功能模块覆盖" },
    { title: "响应式设计", description: "支持移动端、平板、桌面" },
    { title: "深色主题", description: "统一的视觉风格" },
    { title: "渐变主色", description: "紫色到蓝色渐变" },
    { title: "微交互动画", description: "流畅的用户体验" },
    { title: "骨架屏加载", description: "优雅的等待状态" },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="mb-2 text-3xl font-bold text-[#FAFAFA]">Pages Overview</h1>
        <p className="text-[#A1A1AA]">页面总览 - 完整的用户流程和页面结构</p>
      </div>

      {/* 功能特性 */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6"
          >
            <h3 className="mb-1 font-semibold text-[#FAFAFA]">{feature.title}</h3>
            <p className="text-sm text-[#A1A1AA]">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-12">
        {/* 图片模式流程 */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] p-3">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#FAFAFA]">图片模式流程</h2>
              <p className="text-sm text-[#A1A1AA]">首页切换到图片模式后的功能路径</p>
            </div>
          </div>

          <div className="relative">
            <div className="grid gap-4 lg:grid-cols-5">
              {imageModePaths.map((page, index) => (
                <div key={page.path} className="relative">
                  <PageCard {...page} />

                  {index < imageModePaths.length - 1 && (
                    <div className="absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 lg:block">
                      <ArrowRight className="h-5 w-5 text-[#3F3F46]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 视频模式流程 */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] p-3">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#FAFAFA]">视频模式流程</h2>
              <p className="text-sm text-[#A1A1AA]">首页切换到视频模式后的功能路径</p>
            </div>
          </div>

          <div className="relative">
            <div className="grid gap-4 lg:grid-cols-5">
              {videoModePaths.map((page, index) => (
                <div key={page.path} className="relative">
                  <PageCard {...page} />

                  {index < videoModePaths.length - 1 && (
                    <div className="absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 lg:block">
                      <ArrowRight className="h-5 w-5 text-[#3F3F46]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 通用页面 */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#10B981] p-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#FAFAFA]">通用页面</h2>
              <p className="text-sm text-[#A1A1AA]">所有模式下都可以访问的页面</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {commonPages.map((page) => (
              <PageCard key={page.path} {...page} />
            ))}
          </div>
        </section>

        {/* 页面状态清单 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">交互状态清单</h2>

          <div className="space-y-6">
            <StateChecklistCard
              title="首页"
              states={[
                { name: "空状态（示例提示词气泡）", completed: true },
                { name: "生成中（3种动画）", completed: true },
                { name: "生成完成（结果展示）", completed: true },
                { name: "批量结果（缩略图侧边栏）", completed: true },
                { name: "高级选项展开/收起", completed: true },
              ]}
            />

            <StateChecklistCard
              title="画廊页"
              states={[
                { name: "有内容（瀑布流布局）", completed: true },
                { name: "空状态", completed: true },
                { name: "筛选中", completed: true },
                { name: "详情弹窗", completed: true },
                { name: "骨架屏加载", completed: true },
              ]}
            />

            <StateChecklistCard
              title="图生视频页"
              states={[
                { name: "上传前（空状态）", completed: true },
                { name: "已上传（图片预览）", completed: true },
                { name: "生成中（进度动画）", completed: true },
                { name: "生成完成（视频播放器）", completed: true },
              ]}
            />

            <StateChecklistCard
              title="通用组件"
              states={[
                { name: "导航栏（各页面高亮）", completed: true },
                { name: "Toast 通知（成功/错误/警告）", completed: true },
                { name: "加载骨架屏", completed: true },
                { name: "渐进式图片加载", completed: true },
                { name: "模态弹窗", completed: true },
              ]}
            />
          </div>
        </section>

        {/* 响应式断点 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">响应式断点</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-2 font-semibold text-[#FAFAFA]">Mobile</h3>
              <p className="text-2xl font-bold text-[#7C3AED]">375px</p>
              <p className="mt-2 text-xs text-[#71717A]">小屏手机</p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-2 font-semibold text-[#FAFAFA]">Tablet</h3>
              <p className="text-2xl font-bold text-[#7C3AED]">768px</p>
              <p className="mt-2 text-xs text-[#71717A]">平板设备</p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-2 font-semibold text-[#FAFAFA]">Desktop</h3>
              <p className="text-2xl font-bold text-[#7C3AED]">1280px</p>
              <p className="mt-2 text-xs text-[#71717A]">标准桌面</p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-2 font-semibold text-[#FAFAFA]">Wide</h3>
              <p className="text-2xl font-bold text-[#7C3AED]">1440px</p>
              <p className="mt-2 text-xs text-[#71717A]">宽屏显示器</p>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">技术栈与依赖</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-4 font-semibold text-[#FAFAFA]">核心框架</h3>
              <ul className="space-y-2 text-sm text-[#A1A1AA]">
                <li>• Next.js 15</li>
                <li>• TypeScript</li>
                <li>• React 19</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-4 font-semibold text-[#FAFAFA]">样式与动画</h3>
              <ul className="space-y-2 text-sm text-[#A1A1AA]">
                <li>• Tailwind CSS 4</li>
                <li>• Motion (Framer Motion)</li>
                <li>• Lucide Icons</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-4 font-semibold text-[#FAFAFA]">UI 组件</h3>
              <ul className="space-y-2 text-sm text-[#A1A1AA]">
                <li>• Radix UI</li>
                <li>• Sonner (Toast)</li>
                <li>• next-themes</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6">
              <h3 className="mb-4 font-semibold text-[#FAFAFA]">功能库</h3>
              <ul className="space-y-2 text-sm text-[#A1A1AA]">
                <li>• React Hook Form</li>
                <li>• clsx + tailwind-merge</li>
                <li>• class-variance-authority</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PageCard({
  name,
  icon: Icon,
  available,
  label,
}: {
  name: string;
  icon: LucideIcon;
  path: string;
  available: boolean;
  label?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: available ? 1.02 : 1, borderColor: available ? "#7C3AED" : "#3F3F46" }}
      className={`rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6 transition-colors ${
        !available && "opacity-60"
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`rounded-xl p-3 ${
            available ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB]" : "bg-[#27272A]"
          }`}
        >
          <Icon className={`h-6 w-6 ${available ? "text-white" : "text-[#71717A]"}`} />
        </div>
        {label && (
          <span className="rounded-full bg-[#F59E0B]/20 px-3 py-1 text-xs text-[#F59E0B]">
            {label}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-[#FAFAFA]">{name}</h3>
    </motion.div>
  );
}

function StateChecklistCard({
  title,
  states,
}: {
  title: string;
  states: Array<{ name: string; completed: boolean }>;
}) {
  return (
    <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">{title}</h3>
      <div className="space-y-2">
        {states.map((state) => (
          <div key={state.name} className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded ${
                state.completed ? "bg-[#10B981]" : "border border-[#3F3F46] bg-[#27272A]"
              }`}
            >
              {state.completed && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#A1A1AA]">{state.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
