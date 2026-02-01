"use client";

import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DesignSystemPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    toast.success(`已复制 ${label}`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colors = {
    backgrounds: [
      { name: "Background Primary", value: "#09090B", usage: "页面背景" },
      { name: "Background Secondary", value: "#18181B", usage: "卡片背景" },
      { name: "Background Tertiary", value: "#27272A", usage: "输入框、次级元素" },
    ],
    borders: [
      { name: "Border Default", value: "#3F3F46", usage: "默认边框" },
      { name: "Border Hover", value: "#7C3AED", usage: "悬停边框" },
      { name: "Border Focus", value: "#7C3AED", usage: "聚焦边框 + ring" },
    ],
    primary: [
      { name: "Primary Gradient", value: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)", usage: "主按钮渐变" },
      { name: "Primary Solid", value: "#7C3AED", usage: "主色单色" },
    ],
    semantic: [
      { name: "Success", value: "#10B981", usage: "成功状态" },
      { name: "Warning", value: "#F59E0B", usage: "警告状态" },
      { name: "Error", value: "#EF4444", usage: "错误状态" },
      { name: "Info", value: "#3B82F6", usage: "信息提示" },
    ],
    text: [
      { name: "Text Primary", value: "#FAFAFA", usage: "主要文字" },
      { name: "Text Secondary", value: "#A1A1AA", usage: "次要文字" },
      { name: "Text Muted", value: "#71717A", usage: "弱化文字" },
      { name: "Text Disabled", value: "#52525B", usage: "禁用文字" },
    ],
  };

  const typography = [
    { name: "H1", size: "32px", weight: "700", color: "#FAFAFA", sample: "主标题样式" },
    { name: "H2", size: "24px", weight: "600", color: "#FAFAFA", sample: "二级标题样式" },
    { name: "H3", size: "18px", weight: "600", color: "#FAFAFA", sample: "三级标题样式" },
    { name: "H4", size: "16px", weight: "600", color: "#FAFAFA", sample: "四级标题样式" },
    { name: "Body Large", size: "16px", weight: "400", color: "#FAFAFA", sample: "大号正文样式" },
    { name: "Body", size: "14px", weight: "400", color: "#FAFAFA", sample: "标准正文样式" },
    { name: "Body Small", size: "12px", weight: "400", color: "#A1A1AA", sample: "小号正文样式" },
    { name: "Caption", size: "12px", weight: "400", color: "#71717A", sample: "说明文字样式" },
    { name: "Label", size: "14px", weight: "500", color: "#A1A1AA", sample: "标签文字样式" },
    { name: "Button", size: "14px", weight: "500", color: "#FAFAFA", sample: "按钮文字样式" },
  ];

  const spacing = [
    { name: "xs", value: "4px", class: "h-1 w-1" },
    { name: "sm", value: "8px", class: "h-2 w-2" },
    { name: "md", value: "12px", class: "h-3 w-3" },
    { name: "base", value: "16px", class: "h-4 w-4" },
    { name: "lg", value: "24px", class: "h-6 w-6" },
    { name: "xl", value: "32px", class: "h-8 w-8" },
    { name: "2xl", value: "48px", class: "h-12 w-12" },
    { name: "3xl", value: "64px", class: "h-16 w-16" },
  ];

  const borderRadius = [
    { name: "小元素", value: "4px", usage: "标签、徽章" },
    { name: "按钮", value: "8px", usage: "按钮、输入框" },
    { name: "卡片", value: "12px", usage: "卡片、下拉菜单" },
    { name: "大卡片", value: "16px", usage: "大卡片、弹窗" },
    { name: "特大容器", value: "24px", usage: "特大容器" },
    { name: "药丸形", value: "999px", usage: "完全圆角" },
  ];

  const shadows = [
    { name: "Shadow SM", value: "0 1px 2px rgba(0,0,0,0.3)", usage: "小阴影" },
    { name: "Shadow MD", value: "0 4px 6px rgba(0,0,0,0.3)", usage: "中阴影" },
    { name: "Shadow LG", value: "0 10px 15px rgba(0,0,0,0.3)", usage: "大阴影" },
    { name: "Shadow Glow Purple", value: "0 0 20px rgba(124, 58, 237, 0.3)", usage: "紫色发光" },
    { name: "Shadow Glow Green", value: "0 0 20px rgba(16, 185, 129, 0.3)", usage: "绿色发光" },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="mb-2 text-3xl font-bold text-[#FAFAFA]">Design System</h1>
        <p className="text-[#A1A1AA]">AI 创作工坊 - 设计系统规范文档</p>
        <div className="mt-4 rounded-xl border border-[#3F3F46] bg-[#18181B] p-4">
          <p className="text-sm text-[#71717A]">
            版本：v1.0 | 更新日期：2026-01-30 | 技术栈：Next.js + TypeScript + Tailwind CSS + Motion
          </p>
        </div>
      </div>

      <div className="space-y-16">
        {/* 1. 颜色系统 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">1. 颜色系统 (Colors)</h2>

          {/* 背景色 */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">背景色</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {colors.backgrounds.map((color) => (
                <ColorCard key={color.name} {...color} onCopy={copyToClipboard} copied={copiedColor === color.value} />
              ))}
            </div>
          </div>

          {/* 边框色 */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">边框色</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {colors.borders.map((color) => (
                <ColorCard key={color.name} {...color} onCopy={copyToClipboard} copied={copiedColor === color.value} />
              ))}
            </div>
          </div>

          {/* 主色 */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">主色</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {colors.primary.map((color) => (
                <ColorCard key={color.name} {...color} onCopy={copyToClipboard} copied={copiedColor === color.value} isGradient={color.name.includes("Gradient")} />
              ))}
            </div>
          </div>

          {/* 语义色 */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">语义色</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colors.semantic.map((color) => (
                <ColorCard key={color.name} {...color} onCopy={copyToClipboard} copied={copiedColor === color.value} />
              ))}
            </div>
          </div>

          {/* 文字色 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[#FAFAFA]">文字色</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colors.text.map((color) => (
                <ColorCard key={color.name} {...color} onCopy={copyToClipboard} copied={copiedColor === color.value} />
              ))}
            </div>
          </div>
        </section>

        {/* 2. 字体系统 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">2. 字体系统 (Typography)</h2>
          <div className="space-y-4">
            {typography.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[#A1A1AA]">{type.name}</h4>
                    <p className="text-xs text-[#71717A]">
                      {type.size} / {type.weight} / {type.color}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: type.size,
                    fontWeight: type.weight,
                    color: type.color,
                  }}
                >
                  {type.sample}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 间距系统 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">3. 间距系统 (Spacing)</h2>
          <p className="mb-6 text-sm text-[#A1A1AA]">基于 4px 网格系统</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {spacing.map((space) => (
              <div
                key={space.name}
                className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6"
              >
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#FAFAFA]">{space.name}</h4>
                  <p className="text-xs text-[#71717A]">{space.value}</p>
                </div>
                <div className="flex items-center">
                  <div
                    className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB]"
                    style={{ width: space.value, height: space.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 圆角系统 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">4. 圆角系统 (Border Radius)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {borderRadius.map((radius) => (
              <div
                key={radius.name}
                className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6"
              >
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#FAFAFA]">{radius.name}</h4>
                  <p className="text-xs text-[#71717A]">{radius.value}</p>
                  <p className="text-xs text-[#71717A]">用于：{radius.usage}</p>
                </div>
                <div
                  className="h-16 w-16 bg-gradient-to-r from-[#7C3AED] to-[#2563EB]"
                  style={{ borderRadius: radius.value }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. 阴影系统 */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-[#FAFAFA]">5. 阴影系统 (Shadows)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shadows.map((shadow) => (
              <div
                key={shadow.name}
                className="rounded-xl border border-[#3F3F46] bg-[#18181B] p-6"
              >
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#FAFAFA]">{shadow.name}</h4>
                  <p className="text-xs text-[#71717A]">用于：{shadow.usage}</p>
                </div>
                <div className="flex items-center justify-center p-8">
                  <div
                    className="h-16 w-16 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB]"
                    style={{ boxShadow: shadow.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorCard({
  name,
  value,
  usage,
  onCopy,
  copied,
  isGradient = false,
}: {
  name: string;
  value: string;
  usage: string;
  onCopy: (value: string, name: string) => void;
  copied: boolean;
  isGradient?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group overflow-hidden rounded-xl border border-[#3F3F46] bg-[#18181B]"
    >
      <div
        className="h-24"
        style={isGradient ? { background: value } : { backgroundColor: value }}
      />
      <div className="p-4">
        <h4 className="mb-1 text-sm font-medium text-[#FAFAFA]">{name}</h4>
        <div className="flex items-center justify-between">
          <code className="text-xs text-[#A1A1AA]">
            {isGradient ? "渐变" : value}
          </code>
          <button
            onClick={() => onCopy(value, name)}
            className="rounded p-1 text-[#71717A] opacity-0 transition-all hover:bg-[#27272A] hover:text-[#FAFAFA] group-hover:opacity-100"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-[#71717A]">{usage}</p>
      </div>
    </motion.div>
  );
}
