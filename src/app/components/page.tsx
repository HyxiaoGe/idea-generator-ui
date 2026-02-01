"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Heart, Share2, Sparkles, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function ComponentsLibraryPage() {
  const [progress] = useState(45);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="mb-2 text-3xl font-bold text-[#FAFAFA]">Components Library</h1>
        <p className="text-[#A1A1AA]">组件库 - 所有可复用组件及其变体</p>
      </div>

      <div className="space-y-16">
        {/* 1. 按钮 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">1. 按钮 (Buttons)</h2>

          {/* Primary */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">Primary（主按钮 - 渐变）</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ComponentShowcase label="Default">
                <Button className="w-full">生成图片</Button>
              </ComponentShowcase>
              <ComponentShowcase label="Hover" description="悬停状态（手动演示）">
                <Button className="w-full hover:opacity-90">生成图片</Button>
              </ComponentShowcase>
              <ComponentShowcase label="With Icon">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成图片
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Disabled">
                <Button className="w-full" disabled>生成图片</Button>
              </ComponentShowcase>
            </div>
          </div>

          {/* Secondary */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">Secondary（次要按钮）</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ComponentShowcase label="Default">
                <Button variant="secondary" className="w-full">取消</Button>
              </ComponentShowcase>
              <ComponentShowcase label="With Icon">
                <Button variant="secondary" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  下载
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Icon Only">
                <Button variant="secondary" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Disabled">
                <Button variant="secondary" className="w-full" disabled>取消</Button>
              </ComponentShowcase>
            </div>
          </div>

          {/* Ghost */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">Ghost（幽灵按钮）</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ComponentShowcase label="Default">
                <Button variant="ghost" className="w-full">查看全部</Button>
              </ComponentShowcase>
              <ComponentShowcase label="With Icon">
                <Button variant="ghost" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  分享
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Icon Only">
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Disabled">
                <Button variant="ghost" className="w-full" disabled>查看全部</Button>
              </ComponentShowcase>
            </div>
          </div>

          {/* Outline */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">Outline（描边按钮）</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ComponentShowcase label="Default">
                <Button variant="outline" className="w-full">重新生成</Button>
              </ComponentShowcase>
              <ComponentShowcase label="With Icon">
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  重新生成
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Icon Only">
                <Button variant="outline" size="icon">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </ComponentShowcase>
              <ComponentShowcase label="Disabled">
                <Button variant="outline" className="w-full" disabled>重新生成</Button>
              </ComponentShowcase>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">尺寸变体</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ComponentShowcase label="Small">
                <Button size="sm" className="w-full">小按钮</Button>
              </ComponentShowcase>
              <ComponentShowcase label="Default">
                <Button className="w-full">默认按钮</Button>
              </ComponentShowcase>
              <ComponentShowcase label="Large">
                <Button size="lg" className="w-full">大按钮</Button>
              </ComponentShowcase>
            </div>
          </div>
        </section>

        {/* 2. 输入框 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">2. 输入框 (Inputs)</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <ComponentShowcase label="Default" description="默认状态">
              <Input placeholder="输入提示词..." />
            </ComponentShowcase>

            <ComponentShowcase label="With Label" description="带标签">
              <div className="space-y-2">
                <label className="text-sm text-[#A1A1AA]">提示词</label>
                <Input placeholder="描述你想要的图片..." />
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Disabled" description="禁用状态">
              <Input placeholder="禁用状态" disabled />
            </ComponentShowcase>

            <ComponentShowcase label="With Error" description="错误状态">
              <div className="space-y-2">
                <Input placeholder="输入内容" className="border-[#EF4444]" />
                <p className="text-xs text-[#EF4444]">提示词不能为空</p>
              </div>
            </ComponentShowcase>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">Textarea</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentShowcase label="Default">
                <Textarea placeholder="输入详细描述..." rows={4} />
              </ComponentShowcase>

              <ComponentShowcase label="With Counter" description="带字数统计">
                <div className="space-y-2">
                  <Textarea placeholder="输入详细描述..." rows={4} />
                  <p className="text-right text-xs text-[#71717A]">0 / 500</p>
                </div>
              </ComponentShowcase>
            </div>
          </div>
        </section>

        {/* 3. 选择器 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">3. 选择器 (Selects)</h2>

          <div className="grid gap-6 lg:grid-cols-3">
            <ComponentShowcase label="Default">
              <Select defaultValue="gemini">
                <SelectTrigger>
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="dalle">DALL·E 3</SelectItem>
                  <SelectItem value="midjourney">Midjourney</SelectItem>
                </SelectContent>
              </Select>
            </ComponentShowcase>

            <ComponentShowcase label="With Label">
              <div className="space-y-2">
                <label className="text-sm text-[#A1A1AA]">生成模型</label>
                <Select defaultValue="gemini">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="dalle">DALL·E 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Disabled">
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="禁用状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">选项 1</SelectItem>
                </SelectContent>
              </Select>
            </ComponentShowcase>
          </div>
        </section>

        {/* 4. 卡片 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">4. 卡片 (Cards)</h2>

          {/* 基础卡片 */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">基础卡片</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ComponentShowcase label="Default" fullHeight>
                <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6">
                  <h4 className="mb-2 font-semibold text-[#FAFAFA]">卡片标题</h4>
                  <p className="text-sm text-[#A1A1AA]">卡片描述内容</p>
                </div>
              </ComponentShowcase>

              <ComponentShowcase label="With Image" fullHeight>
                <div className="overflow-hidden rounded-2xl border border-[#3F3F46] bg-[#18181B]">
                  <div className="h-32 bg-gradient-to-r from-[#7C3AED] to-[#2563EB]" />
                  <div className="p-4">
                    <h4 className="mb-1 font-semibold text-[#FAFAFA]">图片卡片</h4>
                    <p className="text-sm text-[#A1A1AA]">带图片的卡片样式</p>
                  </div>
                </div>
              </ComponentShowcase>

              <ComponentShowcase label="Hover State" fullHeight>
                <motion.div
                  whileHover={{ scale: 1.02, borderColor: "#7C3AED" }}
                  className="cursor-pointer rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6 transition-colors"
                >
                  <h4 className="mb-2 font-semibold text-[#FAFAFA]">可交互卡片</h4>
                  <p className="text-sm text-[#A1A1AA]">悬停查看效果</p>
                </motion.div>
              </ComponentShowcase>
            </div>
          </div>

          {/* 进阶模式卡片 */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">进阶模式卡片</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ComponentShowcase label="Available" fullHeight>
                <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] p-3">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-[#10B981]/20 text-[#10B981]">可用</Badge>
                  </div>
                  <h4 className="mb-2 font-semibold text-[#FAFAFA]">对话微调</h4>
                  <p className="text-sm text-[#A1A1AA]">通过对话迭代优化图片</p>
                </div>
              </ComponentShowcase>

              <ComponentShowcase label="Coming Soon" fullHeight>
                <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6 opacity-60">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-xl bg-[#27272A] p-3">
                      <ImageIcon className="h-6 w-6 text-[#71717A]" />
                    </div>
                    <Badge variant="secondary">即将上线</Badge>
                  </div>
                  <h4 className="mb-2 font-semibold text-[#FAFAFA]">脚本生成</h4>
                  <p className="text-sm text-[#A1A1AA]">AI 自动生成视频脚本</p>
                </div>
              </ComponentShowcase>
            </div>
          </div>
        </section>

        {/* 5. 骨架屏 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">5. 骨架屏 (Skeletons)</h2>

          <div className="grid gap-6 lg:grid-cols-3">
            <ComponentShowcase label="Image Skeleton" fullHeight>
              <Skeleton className="aspect-square w-full" />
            </ComponentShowcase>

            <ComponentShowcase label="Text Skeleton" fullHeight>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-4/5" variant="text" />
                <Skeleton className="h-4 w-3/5" variant="text" />
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Card Skeleton" fullHeight>
              <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-6">
                <Skeleton className="mb-4 h-12 w-12" />
                <Skeleton className="mb-2 h-4 w-2/3" variant="text" />
                <Skeleton className="h-3 w-4/5" variant="text" />
              </div>
            </ComponentShowcase>
          </div>
        </section>

        {/* 6. 加载状态 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">6. 加载状态 (Loading States)</h2>

          <div className="grid gap-6 lg:grid-cols-3">
            <ComponentShowcase label="Spinner Small">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Spinner Medium">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]" />
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Spinner Large">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-16 w-16 animate-spin text-[#7C3AED]" />
              </div>
            </ComponentShowcase>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-medium text-[#FAFAFA]">进度条</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentShowcase label="Default">
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center text-sm text-[#A1A1AA]">{progress}%</p>
                </div>
              </ComponentShowcase>

              <ComponentShowcase label="With Label">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A1A1AA]">生成中...</span>
                    <span className="text-[#FAFAFA]">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </ComponentShowcase>
            </div>
          </div>
        </section>

        {/* 7. 空状态 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">7. 空状态 (Empty States)</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            <ComponentShowcase label="No Content" fullHeight>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="mb-4 h-12 w-12 text-[#71717A]" />
                <h4 className="mb-2 font-semibold text-[#FAFAFA]">还没有内容</h4>
                <p className="mb-4 text-sm text-[#A1A1AA]">开始创作你的第一张图片</p>
                <Button size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始创作
                </Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase label="Error State" fullHeight>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-[#EF4444]" />
                <h4 className="mb-2 font-semibold text-[#FAFAFA]">加载失败</h4>
                <p className="mb-4 text-sm text-[#A1A1AA]">请检查网络连接后重试</p>
                <Button size="sm" variant="outline">重试</Button>
              </div>
            </ComponentShowcase>
          </div>
        </section>

        {/* 8. 徽章 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">8. 徽章 (Badges)</h2>

          <div className="grid gap-6 lg:grid-cols-4">
            <ComponentShowcase label="Default">
              <Badge>默认</Badge>
            </ComponentShowcase>

            <ComponentShowcase label="Success">
              <Badge className="bg-[#10B981]/20 text-[#10B981]">成功</Badge>
            </ComponentShowcase>

            <ComponentShowcase label="Warning">
              <Badge className="bg-[#F59E0B]/20 text-[#F59E0B]">警告</Badge>
            </ComponentShowcase>

            <ComponentShowcase label="Error">
              <Badge className="bg-[#EF4444]/20 text-[#EF4444]">错误</Badge>
            </ComponentShowcase>
          </div>
        </section>
      </div>
    </div>
  );
}

function ComponentShowcase({
  label,
  description,
  children,
  fullHeight = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-[#3F3F46] bg-[#09090B] p-4 ${fullHeight ? "h-full" : ""}`}>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-[#FAFAFA]">{label}</h4>
        {description && <p className="text-xs text-[#71717A]">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
