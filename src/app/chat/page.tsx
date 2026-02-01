"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCw, Copy, Send, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  image?: string;
  version?: number;
  timestamp?: string;
  loading?: boolean;
}

const samplePrompts = [
  "生成一只橘猫坐在窗边",
  "画一个赛博朋克风格的城市",
  "创作一幅抽象艺术画",
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentVersion, setCurrentVersion] = useState(0);
  const [currentImage, setCurrentImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const versions = messages
    .filter((m) => m.role === "assistant" && m.image)
    .map((m, index) => ({
      id: m.version || index + 1,
      image: m.image!,
      timestamp: m.timestamp || `${14 + index}:${30 + index * 2}`,
    }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const loadingMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        loading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      setTimeout(() => {
        setImageLoading(true);
        const assistantMessage: Message = {
          id: Date.now() + 2,
          role: "assistant",
          content: "我已经为您生成了图片，请查看。",
          image: `https://images.unsplash.com/photo-${
            messages.length % 2 === 0
              ? "1761223956832-a1e341babb92"
              : "1655435439159-92d407ae9ab5"
          }?w=400`,
          version: versions.length + 1,
          timestamp: new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.loading).concat(assistantMessage)
        );
        setCurrentVersion(assistantMessage.version!);
        setCurrentImage(assistantMessage.image!.replace("w=400", "w=800"));
        setIsLoading(false);

        setTimeout(() => {
          setImageLoading(false);
          toast.success("图片生成完成");
        }, 1000);
      }, 2000);
    }, 500);
  };

  const handleExampleClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => router.push("/")} />
          <h1 className="text-2xl font-semibold text-text-primary">对话微调</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">
            导出对话
          </Button>
          <Button
            onClick={() => {
              setMessages([]);
              setCurrentImage("");
              toast.info("已创建新对话");
            }}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
          >
            新对话
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex min-h-[600px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
            <div className="relative">
              <div className="absolute -left-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-2xl">
                💬
              </div>
              <div className="h-12 w-12 rounded-lg bg-surface p-2">
                <div className="h-full w-full rounded-md bg-gradient-to-br from-[#7C3AED]/40 to-[#2563EB]/40"></div>
              </div>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-text-primary">
            开始你的创作对话
          </h2>
          <p className="mb-8 text-center text-sm text-text-secondary">
            描述你想要的画面，我会帮你一步步完善
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {samplePrompts.map((prompt, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleExampleClick(prompt)}
                className="rounded-full border border-border bg-surface-secondary px-4 py-2 text-sm text-text-primary transition-all hover:border-[#7C3AED] hover:bg-surface hover:shadow-lg hover:shadow-[#7C3AED]/20"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[45%,55%]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 font-semibold text-text-primary">当前图片</h3>

            <div className="mb-4 overflow-hidden rounded-xl bg-background">
              {imageLoading ? (
                <div className="flex aspect-square items-center justify-center">
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-surface via-surface-secondary to-surface bg-[length:200%_100%]"></div>
                </div>
              ) : currentImage ? (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={currentImage}
                  alt="Current version"
                  className="w-full"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center border-2 border-dashed border-border">
                  <p className="text-sm text-text-secondary">等待生成...</p>
                </div>
              )}
            </div>

            <div className="mb-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" disabled={!currentImage}>
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" disabled={!currentImage}>
                <RotateCw className="mr-2 h-4 w-4" />
                重新生成
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" disabled={!currentImage}>
                <Copy className="mr-2 h-4 w-4" />
                复制提示词
              </Button>
            </div>

            {versions.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-text-secondary">历史版本</p>
                <div className="flex gap-2 overflow-x-auto">
                  {versions.map((version) => (
                    <motion.button
                      key={version.id}
                      whileHover={{ scale: currentVersion === version.id ? 1 : 1.05 }}
                      onClick={() => {
                        setCurrentVersion(version.id);
                        setCurrentImage(version.image.replace("w=200", "w=800"));
                      }}
                      className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        currentVersion === version.id
                          ? "scale-110 border-[#7C3AED] shadow-lg shadow-[#7C3AED]/50"
                          : "border-border hover:border-text-secondary"
                      }`}
                    >
                      <img
                        src={version.image}
                        alt={`Version ${version.id}`}
                        className="h-16 w-16 object-cover"
                      />
                      <div className="bg-surface-secondary px-2 py-1">
                        <div className="text-xs font-medium text-text-primary">v{version.id}</div>
                        <div className="text-[10px] text-text-secondary">{version.timestamp}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-surface">
            <div className="border-b border-border p-6">
              <h3 className="font-semibold text-text-primary">对话历史</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6" style={{ maxHeight: "500px" }}>
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB]">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-xl p-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
                          : "border border-border bg-surface-secondary text-text-primary"
                      }`}
                    >
                      {message.loading ? (
                        <div className="flex gap-1 py-2">
                          <motion.div
                            className="h-2 w-2 rounded-full bg-text-secondary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="h-2 w-2 rounded-full bg-text-secondary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="h-2 w-2 rounded-full bg-text-secondary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{message.content}</p>
                          {message.image && (
                            <button
                              onClick={() => {
                                setCurrentImage(message.image!.replace("w=400", "w=800"));
                                setCurrentVersion(message.version || 1);
                              }}
                              className="mt-2 overflow-hidden rounded-lg transition-transform hover:scale-105"
                            >
                              <img src={message.image} alt="Generated" className="w-full" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#10B981]">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="描述你想要的修改，如：让背景变成星空..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                  className="flex-1 rounded-xl"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] disabled:opacity-50"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Send className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
