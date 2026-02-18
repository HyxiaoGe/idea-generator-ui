"use client";

import { motion, AnimatePresence } from "motion/react";

interface ModeCardsProps {
  contentType: "image" | "video";
  onNavigate: (path: string) => void;
}

export function ModeCards({ contentType, onNavigate }: ModeCardsProps) {
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-border h-px flex-1"></div>
        <span className="text-text-secondary text-sm">进阶创作模式</span>
        <div className="bg-border h-px flex-1"></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={contentType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {contentType === "image" ? (
            <>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => onNavigate("/chat")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#7C3AED] hover:shadow-2xl hover:shadow-[#7C3AED]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-2xl transition-transform group-hover:scale-110">
                  💬
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">对话微调</h3>
                <p className="text-text-secondary text-xs">通过对话优化画面</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => onNavigate("/style")}
                className="group border-border bg-surface relative rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#10B981] hover:shadow-2xl hover:shadow-[#10B981]/30"
              >
                <span className="absolute top-3 right-3 rounded-md bg-[#F59E0B]/20 px-1.5 py-0.5 text-[10px] text-[#F59E0B]">
                  演示
                </span>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#06B6D4]/20 text-2xl transition-transform group-hover:scale-110">
                  🎨
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">风格迁移</h3>
                <p className="text-text-secondary text-xs">将风格应用到图片</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => onNavigate("/blend")}
                className="group border-border bg-surface relative rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#06B6D4] hover:shadow-2xl hover:shadow-[#06B6D4]/30"
              >
                <span className="absolute top-3 right-3 rounded-md bg-[#F59E0B]/20 px-1.5 py-0.5 text-[10px] text-[#F59E0B]">
                  演示
                </span>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#10B981]/20 text-2xl transition-transform group-hover:scale-110">
                  🖼️
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">图像混合</h3>
                <p className="text-text-secondary text-xs">多张图片智能融合</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => onNavigate("/image-to-video")}
                className="group border-border bg-surface rounded-2xl border p-6 text-left transition-all duration-300 hover:border-[#F59E0B] hover:shadow-2xl hover:shadow-[#F59E0B]/30"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 text-2xl transition-transform group-hover:scale-110">
                  🎬
                </div>
                <h3 className="text-text-primary mb-1 font-semibold">图生视频</h3>
                <p className="text-text-secondary text-xs">静态图片生成动态视频</p>
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => onNavigate("/image-to-video")}
                className="group bg-surface relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all"
                style={{
                  borderImage: "linear-gradient(to right, #7C3AED, #2563EB) 1",
                  boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)",
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C3AED]/5 to-[#2563EB]/5"></div>

                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 text-2xl">
                      🎬
                    </div>
                    <span className="rounded-md bg-gradient-to-r from-[#7C3AED] to-[#2563EB] px-3 py-1 text-xs font-medium text-white shadow-lg shadow-[#7C3AED]/30">
                      推荐
                    </span>
                  </div>
                  <h3 className="text-text-primary mb-1 font-semibold">图生视频</h3>
                  <p className="text-text-secondary text-xs">上传图片生成动态视频</p>
                </div>
              </motion.button>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  📝
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">脚本生成</h3>
                <p className="text-text-secondary text-xs">输入文字脚本自动生成视频</p>
              </div>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  🔄
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">视频风格迁移</h3>
                <p className="text-text-secondary text-xs">转换视频的艺术风格</p>
              </div>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-1 text-xs text-[#F59E0B]">
                    即将上线
                  </span>
                </div>
                <div className="from-text-secondary/20 to-text-secondary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl opacity-50">
                  ⏱️
                </div>
                <h3 className="text-text-secondary mb-1 font-semibold">视频延长</h3>
                <p className="text-text-secondary text-xs">延长已生成的视频时长</p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
