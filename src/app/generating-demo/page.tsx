"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusMessages = [
  "AI 正在理解你的想法...",
  "正在构思画面布局...",
  "添加细节和光影...",
  "优化色彩和质感...",
  "即将完成...",
];

const tips = [
  "添加「电影感光线」可以让画面更有氛围",
  "使用「4K, 超高清」可以获得更清晰的细节",
  "负面提示词可以帮你避免不想要的元素",
  "尝试组合多个艺术风格，创造独特效果",
  "调整图片比例可以优化构图效果",
];

interface GeneratingStateProps {
  variant: "thinking" | "visualize" | "ripple";
  onCancel?: () => void;
}

function GeneratingState({ variant, onCancel }: GeneratingStateProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsComplete(true);
          return 100;
        }
        const increment = Math.random() * 3 + 1;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Rotate status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stage =
    progress < 30 ? "startup" : progress < 70 ? "processing" : "completing";

  const stageColor =
    stage === "startup"
      ? "#7C3AED"
      : stage === "processing"
      ? "#2563EB"
      : "#10B981";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: isComplete ? 1.1 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tip Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-6 rounded-xl border border-[#3F3F46] bg-[#18181B]/80 p-4 text-center backdrop-blur-sm"
          >
            <p className="text-sm text-[#A1A1AA]">{tips[tipIndex]}</p>
          </motion.div>
        </AnimatePresence>

        {/* Main Animation Area */}
        <div className="mb-8 flex justify-center">
          {variant === "thinking" && (
            <ThinkingAnimation stage={stage} isComplete={isComplete} />
          )}
          {variant === "visualize" && (
            <VisualizeAnimation stage={stage} isComplete={isComplete} />
          )}
          {variant === "ripple" && (
            <RippleAnimation stage={stage} isComplete={isComplete} />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-2" />
            <motion.span
              key={Math.floor(progress)}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-semibold text-[#FAFAFA]"
            >
              {Math.floor(progress)}%
            </motion.span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#27272A]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: isComplete
                  ? "#10B981"
                  : `linear-gradient(to right, ${stageColor}, #2563EB)`,
                boxShadow: isComplete
                  ? "0 0 20px rgba(16, 185, 129, 0.6)"
                  : `0 0 12px ${stageColor}40`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-2 text-center text-sm text-[#FAFAFA]"
          >
            {statusMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Estimated Time */}
        <p className="mb-8 text-center text-xs text-[#71717A]">
          预计还需 {Math.max(1, Math.floor((100 - progress) / 8))} 秒
        </p>

        {/* Cancel Button */}
        {!isComplete && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              <X className="mr-2 h-4 w-4" />
              取消生成
            </Button>
          </div>
        )}

        {/* Completion Confetti */}
        {isComplete && <ConfettiEffect />}
      </motion.div>
    </div>
  );
}

function ThinkingAnimation({
  stage,
  isComplete,
}: {
  stage: string;
  isComplete: boolean;
}) {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeDasharray="60 200"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="50 200"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="40 200"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      </motion.div>

      <motion.div
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#18181B]"
        style={{
          border: "2px solid",
          borderImage: "linear-gradient(135deg, #7C3AED, #2563EB) 1",
          boxShadow: isComplete
            ? "0 0 30px rgba(16, 185, 129, 0.6)"
            : "0 0 20px rgba(124, 58, 237, 0.4)",
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles
          className={`h-8 w-8 ${isComplete ? "text-[#10B981]" : "text-[#7C3AED]"}`}
        />
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#7C3AED]"
          style={{
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI) / 3) * 60],
            y: [0, Math.sin((i * Math.PI) / 3) * 60],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function VisualizeAnimation({
  stage,
  isComplete,
}: {
  stage: string;
  isComplete: boolean;
}) {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-2xl bg-[#18181B]"
        style={{
          border: "1px solid",
          borderColor: isComplete ? "#10B981" : "#3F3F46",
          boxShadow: isComplete
            ? "0 0 30px rgba(16, 185, 129, 0.4)"
            : "0 0 20px rgba(124, 58, 237, 0.2)",
        }}
        animate={{
          boxShadow: isComplete
            ? "0 0 30px rgba(16, 185, 129, 0.4)"
            : [
                "0 0 20px rgba(124, 58, 237, 0.2)",
                "0 0 30px rgba(124, 58, 237, 0.4)",
                "0 0 20px rgba(124, 58, 237, 0.2)",
              ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20"
          style={{
            filter: `blur(${40 - (isComplete ? 40 : 40)}px)`,
          }}
        />

        <motion.div
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"
          animate={{
            y: [0, 200, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.8)",
          }}
        />

        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2">
          {[...Array(64)].map((_, i) => (
            <motion.div
              key={i}
              className="rounded-sm bg-[#7C3AED]/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0, 1, 1] }}
              transition={{
                duration: 0.5,
                delay: i * 0.02,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-12 w-12 text-[#7C3AED]" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function RippleAnimation({
  stage,
  isComplete,
}: {
  stage: string;
  isComplete: boolean;
}) {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            borderColor: isComplete
              ? `rgba(16, 185, 129, ${0.4 - i * 0.1})`
              : `rgba(124, 58, 237, ${0.4 - i * 0.1})`,
          }}
          animate={{
            width: [0, 200],
            height: [0, 200],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}

      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: isComplete
            ? "radial-gradient(circle, #10B981, #059669)"
            : "radial-gradient(circle, #7C3AED, #2563EB)",
          boxShadow: isComplete
            ? "0 0 30px rgba(16, 185, 129, 0.6)"
            : "0 0 30px rgba(124, 58, 237, 0.6)",
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="h-8 w-8 text-white" />
      </motion.div>

      {[...Array(8)].map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        return (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              background: isComplete ? "#10B981" : "#7C3AED",
              boxShadow: isComplete
                ? "0 0 8px rgba(16, 185, 129, 0.8)"
                : "0 0 8px rgba(124, 58, 237, 0.8)",
            }}
            animate={{
              x: [
                Math.cos(angle) * 50,
                Math.cos(angle + Math.PI * 2) * 50,
              ],
              y: [
                Math.sin(angle) * 50,
                Math.sin(angle + Math.PI * 2) * 50,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}
    </div>
  );
}

function ConfettiEffect() {
  return (
    <div className="pointer-events-none fixed inset-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            background: ["#7C3AED", "#2563EB", "#10B981", "#F59E0B"][i % 4],
            left: `${Math.random() * 100}%`,
            top: "50%",
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: [0, -200, 200],
            x: [(Math.random() - 0.5) * 200],
            opacity: [1, 1, 0],
            scale: [1, 1.5, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            delay: i * 0.02,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function GeneratingDemoPage() {
  const router = useRouter();
  const [currentVariant, setCurrentVariant] = useState<
    "thinking" | "visualize" | "ripple"
  >("thinking");
  const [demoKey, setDemoKey] = useState(0);

  const handleDemoComplete = () => {
    setTimeout(() => {
      setDemoKey((prev) => prev + 1);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#09090B]">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="fixed left-6 top-6 z-10 rounded-lg bg-[#18181B] px-4 py-2 text-sm text-[#A1A1AA] transition-colors hover:text-white"
      >
        ← 返回首页
      </button>

      {/* Variant Selector */}
      <div className="fixed left-1/2 top-6 z-10 flex -translate-x-1/2 gap-2 rounded-xl bg-[#18181B] p-2 shadow-lg">
        <button
          onClick={() => {
            setCurrentVariant("thinking");
            setDemoKey((prev) => prev + 1);
          }}
          className={`rounded-lg px-4 py-2 text-sm transition-all ${
            currentVariant === "thinking"
              ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          AI 思考动画
        </button>
        <button
          onClick={() => {
            setCurrentVariant("visualize");
            setDemoKey((prev) => prev + 1);
          }}
          className={`rounded-lg px-4 py-2 text-sm transition-all ${
            currentVariant === "visualize"
              ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          图像生成可视化
        </button>
        <button
          onClick={() => {
            setCurrentVariant("ripple");
            setDemoKey((prev) => prev + 1);
          }}
          className={`rounded-lg px-4 py-2 text-sm transition-all ${
            currentVariant === "ripple"
              ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          波纹扩散
        </button>
      </div>

      {/* Info Text */}
      <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-[#18181B]/90 px-4 py-2 text-center text-xs text-[#71717A] backdrop-blur-sm">
        演示模式：进度达到100%后将自动重新开始
      </div>

      <GeneratingState
        key={`${currentVariant}-${demoKey}`}
        variant={currentVariant}
        onCancel={handleDemoComplete}
      />
    </div>
  );
}
