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
                className="group border-border bg-surface hover:border-primary-start hover:shadow-primary-start/30 rounded-2xl border p-6 text-left transition-all duration-300 hover:shadow-2xl"
              >
                <div className="from-primary-start/20 to-primary-end/20 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl transition-transform group-hover:scale-110">
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
                className="group border-border bg-surface hover:border-accent hover:shadow-accent/30 relative rounded-2xl border p-6 text-left transition-all duration-300 hover:shadow-2xl"
              >
                <span className="bg-warning/20 text-warning absolute top-3 right-3 rounded-md px-1.5 py-0.5 text-[10px]">
                  演示
                </span>
                <div className="from-accent/20 to-accent-secondary/20 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl transition-transform group-hover:scale-110">
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
                className="group border-border bg-surface hover:border-accent-secondary hover:shadow-accent-secondary/30 relative rounded-2xl border p-6 text-left transition-all duration-300 hover:shadow-2xl"
              >
                <span className="bg-warning/20 text-warning absolute top-3 right-3 rounded-md px-1.5 py-0.5 text-[10px]">
                  演示
                </span>
                <div className="from-accent-secondary/20 to-accent/20 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl transition-transform group-hover:scale-110">
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
                className="group border-border bg-surface hover:border-warning hover:shadow-warning/30 rounded-2xl border p-6 text-left transition-all duration-300 hover:shadow-2xl"
              >
                <div className="from-warning/20 to-destructive/20 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl transition-transform group-hover:scale-110">
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
                <div className="from-primary-start/5 to-primary-end/5 absolute inset-0 rounded-2xl bg-gradient-to-br"></div>

                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="from-primary-start/20 to-primary-end/20 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl">
                      🎬
                    </div>
                    <span className="from-primary-start to-primary-end shadow-primary-start/30 rounded-md bg-gradient-to-r px-3 py-1 text-xs font-medium text-white shadow-lg">
                      推荐
                    </span>
                  </div>
                  <h3 className="text-text-primary mb-1 font-semibold">图生视频</h3>
                  <p className="text-text-secondary text-xs">上传图片生成动态视频</p>
                </div>
              </motion.button>

              <div className="border-border bg-surface/50 relative cursor-not-allowed rounded-2xl border border-dashed p-6 text-left">
                <div className="absolute top-3 right-3">
                  <span className="bg-warning/20 text-warning rounded-md px-2 py-1 text-xs">
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
                  <span className="bg-warning/20 text-warning rounded-md px-2 py-1 text-xs">
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
                  <span className="bg-warning/20 text-warning rounded-md px-2 py-1 text-xs">
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
