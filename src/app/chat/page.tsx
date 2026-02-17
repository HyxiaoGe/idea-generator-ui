"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  RotateCw,
  Copy,
  Send,
  User,
  Bot,
  FileDown,
  Trash2,
  MessageSquare,
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
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";
import { RequireAuth } from "@/lib/auth/require-auth";
import { getApiClient } from "@/lib/api-client";
import { getImageUrl, formatRelativeTime } from "@/lib/transforms";
import type { AspectRatio, ListChatsResponse } from "@/lib/types";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  image?: string;
  version?: number;
  timestamp?: string;
  loading?: boolean;
}

const samplePrompts = ["生成一只橘猫坐在窗边", "画一个赛博朋克风格的城市", "创作一幅抽象艺术画"];

const SESSION_STORAGE_KEY = "chat_session_id";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentVersion, setCurrentVersion] = useState(0);
  const [currentImage, setCurrentImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history list
  const { data: chatListData, mutate: mutateChatList } = useSWR<ListChatsResponse>("/chat", null, {
    revalidateOnFocus: false,
  });

  const chatSessions = chatListData?.sessions || [];

  const versions = messages
    .filter((m) => m.role === "assistant" && m.image)
    .map((m, index) => ({
      id: m.version || index + 1,
      image: m.image!,
      timestamp: m.timestamp || "",
    }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
      const api = getApiClient();
      api
        .getChatHistory(savedSessionId)
        .then((history) => {
          setSessionId(savedSessionId);
          setAspectRatio((history.aspect_ratio as AspectRatio) || "16:9");
          const restoredMessages: Message[] = history.messages.map((msg, idx) => {
            const imageUrl = msg.image ? getImageUrl(msg.image.url || msg.image.key) : undefined;
            return {
              id: idx,
              role: msg.role,
              content: msg.content,
              image: imageUrl,
              version: msg.role === "assistant" && imageUrl ? idx : undefined,
              timestamp: new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          });
          setMessages(restoredMessages);

          // Set current image to last assistant image
          const lastImage = restoredMessages.filter((m) => m.role === "assistant" && m.image).pop();
          if (lastImage) {
            setCurrentImage(lastImage.image!);
            setCurrentVersion(lastImage.version || 0);
          }
        })
        .catch(() => {
          // Session not found (404), clear storage
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        });
    }
  }, []);

  // Persist sessionId to sessionStorage
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  }, [sessionId]);

  const createSession = useCallback(async () => {
    const api = getApiClient();
    try {
      const result = await api.createChat(aspectRatio);
      setSessionId(result.session_id);
      return result.session_id;
    } catch {
      toast.error("创建会话失败");
      return null;
    }
  }, [aspectRatio]);

  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const text = messageOverride || input.trim();
      if (!text || isLoading) return;

      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!messageOverride) setInput("");
      setIsLoading(true);

      // Show loading message
      const loadingMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        loading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        // Create session if needed
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          currentSessionId = await createSession();
          if (!currentSessionId) {
            setMessages((prev) => prev.filter((m) => !m.loading));
            setIsLoading(false);
            return;
          }
        }

        const api = getApiClient();
        setImageLoading(true);

        const result = await api.sendMessage(currentSessionId, text, {
          aspect_ratio: aspectRatio,
        });

        const imageUrl = result.image
          ? getImageUrl(result.image.url || result.image.key)
          : undefined;

        const assistantMessage: Message = {
          id: Date.now() + 2,
          role: "assistant",
          content: result.text || "我已经为您生成了图片，请查看。",
          image: imageUrl,
          version: versions.length + 1,
          timestamp: new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => prev.filter((m) => !m.loading).concat(assistantMessage));

        if (imageUrl) {
          setCurrentVersion(assistantMessage.version!);
          setCurrentImage(imageUrl);
        }

        setIsLoading(false);
        setImageLoading(false);
        mutateChatList();
        toast.success("图片生成完成");
      } catch (error) {
        setMessages((prev) => prev.filter((m) => !m.loading));
        setIsLoading(false);
        setImageLoading(false);
        const message = error instanceof Error ? error.message : "发送失败";
        toast.error("发送失败", { description: message });
      }
    },
    [input, isLoading, sessionId, createSession, versions.length, aspectRatio, mutateChatList]
  );

  const handleExampleClick = (text: string) => {
    setInput(text);
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentImage("");
    setSessionId(null);
    setCurrentVersion(0);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    toast.info("已创建新对话");
  }, []);

  const handleSwitchSession = useCallback(async (newSessionId: string) => {
    const api = getApiClient();
    try {
      const history = await api.getChatHistory(newSessionId);
      setSessionId(newSessionId);
      setAspectRatio((history.aspect_ratio as AspectRatio) || "16:9");
      const restoredMessages: Message[] = history.messages.map((msg, idx) => {
        const imageUrl = msg.image ? getImageUrl(msg.image.url || msg.image.key) : undefined;
        return {
          id: idx,
          role: msg.role,
          content: msg.content,
          image: imageUrl,
          version: msg.role === "assistant" && imageUrl ? idx : undefined,
          timestamp: new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });
      setMessages(restoredMessages);
      const lastImage = restoredMessages.filter((m) => m.role === "assistant" && m.image).pop();
      if (lastImage) {
        setCurrentImage(lastImage.image!);
        setCurrentVersion(lastImage.version || 0);
      } else {
        setCurrentImage("");
        setCurrentVersion(0);
      }
      setShowHistory(false);
      toast.success("已切换会话");
    } catch {
      toast.error("加载会话失败");
    }
  }, []);

  const handleDeleteSession = useCallback(
    async (delSessionId: string) => {
      const api = getApiClient();
      try {
        await api.deleteChat(delSessionId);
        mutateChatList();
        if (delSessionId === sessionId) {
          handleNewChat();
        }
        toast.success("已删除会话");
      } catch {
        toast.error("删除失败");
      }
    },
    [sessionId, mutateChatList, handleNewChat]
  );

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) {
      toast.info("没有可导出的对话");
      return;
    }
    const text = messages
      .filter((m) => !m.loading)
      .map((m) => {
        const role = m.role === "user" ? "用户" : "AI助手";
        return `[${m.timestamp || ""}] ${role}:\n${m.content}${m.image ? `\n[图片: ${m.image}]` : ""}`;
      })
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("对话已导出");
  }, [messages]);

  const handleRegenerate = useCallback(async () => {
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    // Remove the last assistant reply
    setMessages((prev) => {
      const lastAssistantIdx = prev.findLastIndex((m) => m.role === "assistant");
      if (lastAssistantIdx >= 0) {
        return prev.filter((_, i) => i !== lastAssistantIdx);
      }
      return prev;
    });

    // Re-send the message
    await handleSend(lastUserMsg.content);
  }, [messages, handleSend]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => router.push("/")} />
            <h1 className="text-text-primary text-2xl font-semibold">对话微调</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              历史会话
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleExportChat}>
              <FileDown className="mr-2 h-4 w-4" />
              导出对话
            </Button>
            <Button
              onClick={handleNewChat}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#7C3AED]/90 hover:to-[#2563EB]/90"
            >
              新对话
            </Button>
          </div>
        </div>

        {/* History Sessions Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="border-border bg-surface rounded-2xl border p-4">
                <h3 className="text-text-primary mb-3 font-semibold">历史会话</h3>
                {chatSessions.length === 0 ? (
                  <p className="text-text-secondary py-4 text-center text-sm">暂无历史会话</p>
                ) : (
                  <div className="space-y-2">
                    {chatSessions.map((session) => (
                      <div
                        key={session.session_id}
                        className={`border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-3 transition-all ${
                          session.session_id === sessionId
                            ? "border-[#7C3AED] ring-1 ring-[#7C3AED]/30"
                            : "hover:border-[#7C3AED]/50"
                        }`}
                      >
                        <button
                          onClick={() => handleSwitchSession(session.session_id)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-text-primary text-sm font-medium">
                              会话 {session.session_id.slice(0, 8)}...
                            </p>
                            <span className="text-text-secondary text-xs">
                              {session.message_count} 条消息
                            </span>
                          </div>
                          <p className="text-text-secondary text-xs">
                            {formatRelativeTime(session.last_activity)} · 比例{" "}
                            {session.aspect_ratio}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session.session_id)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 ? (
          <div className="border-border bg-surface flex min-h-[600px] flex-col items-center justify-center rounded-2xl border p-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20">
              <div className="relative">
                <div className="absolute -top-2 -left-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-2xl">
                  💬
                </div>
                <div className="bg-surface h-12 w-12 rounded-lg p-2">
                  <div className="h-full w-full rounded-md bg-gradient-to-br from-[#7C3AED]/40 to-[#2563EB]/40"></div>
                </div>
              </div>
            </div>
            <h2 className="text-text-primary mb-2 text-xl font-semibold">开始你的创作对话</h2>
            <p className="text-text-secondary mb-4 text-center text-sm">
              描述你想要的画面，我会帮你一步步完善
            </p>

            {/* Aspect Ratio Selector */}
            <div className="mb-8 flex items-center gap-2">
              <span className="text-text-secondary text-sm">宽高比:</span>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                <SelectTrigger className="border-border bg-surface-elevated w-[100px] rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="3:4">3:4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {samplePrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleExampleClick(prompt)}
                  className="border-border bg-surface-secondary text-text-primary hover:bg-surface rounded-full border px-4 py-2 text-sm transition-all hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[45%,55%]">
            <div className="border-border bg-surface rounded-2xl border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-primary font-semibold">当前图片</h3>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-xs">比例:</span>
                  <Select
                    value={aspectRatio}
                    onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                  >
                    <SelectTrigger className="border-border bg-surface-elevated h-8 w-[80px] rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="9:16">9:16</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="3:4">3:4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-background mb-4 overflow-hidden rounded-xl">
                {imageLoading ? (
                  <div className="flex aspect-square items-center justify-center">
                    <div className="from-surface via-surface-secondary to-surface h-full w-full animate-pulse bg-gradient-to-r bg-[length:200%_100%]"></div>
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
                  <div className="border-border flex aspect-square items-center justify-center border-2 border-dashed">
                    <p className="text-text-secondary text-sm">等待生成...</p>
                  </div>
                )}
              </div>

              <div className="mb-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={!currentImage}
                  onClick={() => {
                    if (currentImage) {
                      const link = document.createElement("a");
                      link.href = currentImage;
                      link.download = `chat-${Date.now()}.png`;
                      link.click();
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={!currentImage || isLoading}
                  onClick={handleRegenerate}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  重新生成
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={!currentImage}
                  onClick={() => {
                    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
                    if (lastUserMsg) {
                      navigator.clipboard.writeText(lastUserMsg.content);
                      toast.success("已复制提示词");
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制提示词
                </Button>
              </div>

              {versions.length > 0 && (
                <div>
                  <p className="text-text-secondary mb-2 text-xs">历史版本</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {versions.map((version) => (
                      <motion.button
                        key={version.id}
                        whileHover={{ scale: currentVersion === version.id ? 1 : 1.05 }}
                        onClick={() => {
                          setCurrentVersion(version.id);
                          setCurrentImage(version.image);
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
                          <div className="text-text-primary text-xs font-medium">v{version.id}</div>
                          <div className="text-text-secondary text-[10px]">{version.timestamp}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-border bg-surface flex flex-col rounded-2xl border">
              <div className="border-border border-b p-6">
                <h3 className="text-text-primary font-semibold">对话历史</h3>
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
                            : "border-border bg-surface-secondary text-text-primary border"
                        }`}
                      >
                        {message.loading ? (
                          <div className="flex gap-1 py-2">
                            <motion.div
                              className="bg-text-secondary h-2 w-2 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div
                              className="bg-text-secondary h-2 w-2 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div
                              className="bg-text-secondary h-2 w-2 rounded-full"
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
                                  setCurrentImage(message.image!);
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

              <div className="border-border border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="描述你想要的修改，如：让背景变成星空..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    onClick={() => handleSend()}
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
    </RequireAuth>
  );
}
