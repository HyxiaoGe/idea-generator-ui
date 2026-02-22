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
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { useTranslation, dateLocaleMap, getTranslations, getCurrentLanguage } from "@/lib/i18n";
import { useWebSocket } from "@/lib/ws/use-websocket";
import type {
  AspectRatio,
  ListChatsResponse,
  ChatTaskProgress,
  SendMessageResponse,
} from "@/lib/types";

type ChatStage = "loading_history" | "thinking" | "saving" | null;

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  image?: string;
  thinking?: string;
  version?: number;
  timestamp?: string;
  loading?: boolean;
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-xs transition-colors"
      >
        <Brain className="h-3 w-3" />
        {t("chat.thinkingProcess")}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="border-border/50 bg-background/50 mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border p-2.5 text-xs whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  );
}

const SESSION_STORAGE_KEY = "chat_session_id";
let _msgIdCounter = 0;
function nextMsgId() {
  return ++_msgIdCounter;
}

export default function ChatPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const samplePrompts = [t("chat.samplePrompt1"), t("chat.samplePrompt2"), t("chat.samplePrompt3")];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentVersion, setCurrentVersion] = useState(0);
  const [currentImage, setCurrentImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [showHistory, setShowHistory] = useState(false);
  const [includeThinking, setIncludeThinking] = useState(false);
  const [chatStage, setChatStage] = useState<ChatStage>(null);
  const [chatTaskId, setChatTaskId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatResultRef = useRef<SendMessageResponse | null>(null);

  // Listen for chat WebSocket events
  useWebSocket("chat:progress", (data) => {
    console.log("[WS chat:progress]", data);
    const { stage } = data as { stage: string };
    setChatStage(stage as ChatStage);
  });
  useWebSocket("chat:complete", (data) => {
    console.log("[WS chat:complete]", data);
    const { result } = data as { result?: SendMessageResponse };
    if (result) {
      chatResultRef.current = result;
    }
    setChatStage(null);
  });
  useWebSocket("chat:error", (data) => {
    console.log("[WS chat:error]", data);
    setChatStage(null);
  });

  // Fetch chat history list
  const { data: chatListData, mutate: mutateChatList } = useSWR<ListChatsResponse>("/chat", null, {
    revalidateOnFocus: false,
  });

  const chatSessions = chatListData?.sessions || [];

  const versions = messages
    .filter((m) => m.role === "assistant" && m.image)
    .map((m) => ({
      id: m.version!,
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
          const restoredMessages: Message[] = history.messages.map((msg) => {
            const imageUrl = msg.image ? getImageUrl(msg.image.url || msg.image.key) : undefined;
            return {
              id: nextMsgId(),
              role: msg.role,
              content: msg.content,
              image: imageUrl,
              version: msg.role === "assistant" && imageUrl ? nextMsgId() : undefined,
              timestamp: new Date(msg.timestamp).toLocaleTimeString(
                dateLocaleMap[getCurrentLanguage()],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
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
      toast.error(getTranslations().chat.createSessionFailed);
      return null;
    }
  }, [aspectRatio]);

  // Apply completed chat result to messages
  const applyChatResult = useCallback(
    (result: SendMessageResponse) => {
      const imageUrl = result.image ? getImageUrl(result.image.url || result.image.key) : undefined;

      const assistantMessage: Message = {
        id: nextMsgId(),
        role: "assistant",
        content: result.text || getTranslations().chat.defaultAssistantReply,
        image: imageUrl,
        thinking: result.thinking,
        version: nextMsgId(),
        timestamp: new Date().toLocaleTimeString(dateLocaleMap[getCurrentLanguage()], {
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
      setChatStage(null);
      setChatTaskId(null);
      mutateChatList();
      toast.success(getTranslations().chat.imageGenerated);
    },
    [mutateChatList]
  );

  // Poll chat task until complete
  useEffect(() => {
    if (!chatTaskId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;

      // Check if WS already delivered the result
      if (chatResultRef.current) {
        const result = chatResultRef.current;
        chatResultRef.current = null;
        applyChatResult(result);
        return;
      }

      try {
        const tp = await getApiClient().getChatTaskProgress(chatTaskId);
        console.log("[Poll chat:task]", tp.status, tp.stage);
        if (cancelled) return;

        if (tp.stage) setChatStage(tp.stage as ChatStage);

        if (tp.status === "completed" && tp.result) {
          applyChatResult(tp.result);
          return;
        } else if (tp.status === "failed") {
          setMessages((prev) => prev.filter((m) => !m.loading));
          setIsLoading(false);
          setImageLoading(false);
          setChatStage(null);
          setChatTaskId(null);
          toast.error(getTranslations().chat.sendFailed, {
            description: tp.error || getTranslations().common.retry,
          });
          return;
        }
      } catch {
        // poll error, retry next interval
      }

      if (!cancelled) {
        timer = setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chatTaskId, applyChatResult]);

  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const text = messageOverride || input.trim();
      if (!text || isLoading) return;

      const userMessage: Message = {
        id: nextMsgId(),
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString(dateLocaleMap[getCurrentLanguage()], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!messageOverride) setInput("");
      setIsLoading(true);

      // Show loading message
      const loadingMessage: Message = {
        id: nextMsgId(),
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
        chatResultRef.current = null;

        // POST returns immediately with task_id
        const { task_id } = await api.sendMessage(currentSessionId, text, {
          aspect_ratio: aspectRatio,
          enable_thinking: includeThinking,
        });

        // Start polling — result comes via poll or WS
        setChatTaskId(task_id);
      } catch (error) {
        setMessages((prev) => prev.filter((m) => !m.loading));
        setIsLoading(false);
        setImageLoading(false);
        setChatStage(null);
        const tr = getTranslations();
        const message = error instanceof Error ? error.message : tr.chat.sendFailed;
        toast.error(tr.chat.sendFailed, { description: message });
      }
    },
    [input, isLoading, sessionId, createSession, aspectRatio, includeThinking]
  );

  const handleExampleClick = (text: string) => {
    handleSend(text);
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentImage("");
    setSessionId(null);
    setCurrentVersion(0);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    toast.info(getTranslations().chat.newChatCreated);
  }, []);

  const handleSwitchSession = useCallback(async (newSessionId: string) => {
    const api = getApiClient();
    try {
      const history = await api.getChatHistory(newSessionId);
      setSessionId(newSessionId);
      setAspectRatio((history.aspect_ratio as AspectRatio) || "16:9");
      const restoredMessages: Message[] = history.messages.map((msg) => {
        const imageUrl = msg.image ? getImageUrl(msg.image.url || msg.image.key) : undefined;
        return {
          id: nextMsgId(),
          role: msg.role,
          content: msg.content,
          image: imageUrl,
          version: msg.role === "assistant" && imageUrl ? nextMsgId() : undefined,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(dateLocaleMap[language], {
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
      toast.success(getTranslations().chat.switchedSession);
    } catch {
      toast.error(getTranslations().chat.loadSessionFailed);
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
        toast.success(getTranslations().chat.deletedSession);
      } catch {
        toast.error(getTranslations().chat.deleteFailed);
      }
    },
    [sessionId, mutateChatList, handleNewChat]
  );

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) {
      toast.info(getTranslations().chat.nothingToExport);
      return;
    }
    const tr = getTranslations();
    const text = messages
      .filter((m) => !m.loading)
      .map((m) => {
        const role = m.role === "user" ? tr.chat.userRole : tr.chat.assistantRole;
        return `[${m.timestamp || ""}] ${role}:\n${m.content}${m.image ? `\n[${tr.common.image}: ${m.image}]` : ""}`;
      })
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(getTranslations().chat.chatExported);
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
            <h1 className="text-text-primary text-2xl font-semibold">{t("chat.title")}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {t("chat.historySessions")}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleExportChat}>
              <FileDown className="mr-2 h-4 w-4" />
              {t("chat.exportChat")}
            </Button>
            <Button
              onClick={handleNewChat}
              className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 rounded-xl bg-gradient-to-r"
            >
              {t("chat.newChat")}
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
                <h3 className="text-text-primary mb-3 font-semibold">
                  {t("chat.historySessions")}
                </h3>
                {chatSessions.length === 0 ? (
                  <p className="text-text-secondary py-4 text-center text-sm">
                    {t("chat.noHistorySessions")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {chatSessions.map((session) => (
                      <div
                        key={session.session_id}
                        className={`border-border bg-surface-secondary flex items-center justify-between rounded-xl border p-3 transition-all ${
                          session.session_id === sessionId
                            ? "border-primary-start ring-primary-start/30 ring-1"
                            : "hover:border-primary-start/50"
                        }`}
                      >
                        <button
                          onClick={() => handleSwitchSession(session.session_id)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-text-primary text-sm font-medium">
                              {t("chat.session")} {session.session_id.slice(0, 8)}...
                            </p>
                            <span className="text-text-secondary text-xs">
                              {t("chat.messageCount", { count: session.message_count })}
                            </span>
                          </div>
                          <p className="text-text-secondary text-xs">
                            {formatRelativeTime(session.last_activity)} · {t("params.aspectRatio")}{" "}
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
            <div className="from-primary-start/20 to-primary-end/20 mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br">
              <div className="relative">
                <div className="from-primary-start to-primary-end absolute -top-2 -left-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-2xl">
                  💬
                </div>
                <div className="bg-surface h-12 w-12 rounded-lg p-2">
                  <div className="from-primary-start/40 to-primary-end/40 h-full w-full rounded-md bg-gradient-to-br"></div>
                </div>
              </div>
            </div>
            <h2 className="text-text-primary mb-2 text-xl font-semibold">
              {t("chat.startConversation")}
            </h2>
            <p className="text-text-secondary mb-4 text-center text-sm">
              {t("chat.startConversationDesc")}
            </p>

            {/* Aspect Ratio Selector */}
            <div className="mb-8 flex items-center gap-2">
              <span className="text-text-secondary text-sm">{t("chat.aspectRatioLabel")}</span>
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
                  className="border-border bg-surface-secondary text-text-primary hover:bg-surface hover:border-primary-start hover:shadow-primary-start/20 rounded-full border px-4 py-2 text-sm transition-all hover:shadow-lg"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            <div className="mt-8 flex w-full max-w-xl gap-2">
              <Input
                placeholder={t("chat.chatInputPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isLoading}
                className="flex-1 rounded-xl"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="from-primary-start to-primary-end rounded-xl bg-gradient-to-r disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[45%,55%]">
            <div className="border-border bg-surface rounded-2xl border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-primary font-semibold">{t("chat.currentImage")}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-xs">{t("chat.ratio")}</span>
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
                    <p className="text-text-secondary text-sm">{t("chat.waitingForGeneration")}</p>
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
                  {t("common.download")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={!currentImage || isLoading}
                  onClick={handleRegenerate}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  {t("chat.regenerate")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={!currentImage}
                  onClick={() => {
                    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
                    if (lastUserMsg) {
                      navigator.clipboard.writeText(lastUserMsg.content);
                      toast.success(t("chat.copiedPrompt"));
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t("common.copyPrompt")}
                </Button>
              </div>

              {versions.length > 0 && (
                <div>
                  <p className="text-text-secondary mb-2 text-xs">{t("chat.historyVersions")}</p>
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
                            ? "border-primary-start shadow-primary-start/50 scale-110 shadow-lg"
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
                <h3 className="text-text-primary font-semibold">{t("chat.chatHistory")}</h3>
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
                        <div className="from-primary-start to-primary-end flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-xl p-3 ${
                          message.role === "user"
                            ? "from-primary-start to-primary-end bg-gradient-to-r text-white"
                            : "border-border bg-surface-secondary text-text-primary border"
                        }`}
                      >
                        {message.loading ? (
                          <div className="flex items-center gap-2 py-1">
                            <motion.div
                              className="bg-text-secondary h-1.5 w-1.5 rounded-full"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div
                              className="bg-text-secondary h-1.5 w-1.5 rounded-full"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                            />
                            <motion.div
                              className="bg-text-secondary h-1.5 w-1.5 rounded-full"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                            />
                            <span className="text-text-secondary text-xs">
                              {chatStage === "loading_history"
                                ? t("chat.stageLoadingHistory")
                                : chatStage === "thinking"
                                  ? t("chat.stageThinking")
                                  : chatStage === "saving"
                                    ? t("chat.stageSaving")
                                    : t("chat.stageGenerating")}
                            </span>
                          </div>
                        ) : (
                          <>
                            {message.thinking && <ThinkingBlock thinking={message.thinking} />}
                            <p className="text-sm">{message.content}</p>
                            {message.image && (
                              <button
                                onClick={() => {
                                  setCurrentImage(message.image!);
                                  setCurrentVersion(message.version || 1);
                                }}
                                className="text-primary-start hover:text-primary-end mt-1.5 flex items-center gap-1 text-xs transition-colors"
                              >
                                🖼 {t("chat.viewImage")} v{message.version}
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="bg-accent flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="border-border border-t p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Switch
                    id="thinking-toggle"
                    checked={includeThinking}
                    onCheckedChange={setIncludeThinking}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="thinking-toggle"
                    className="text-text-secondary flex cursor-pointer items-center gap-1 text-xs"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    {t("chat.thinkingMode")}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("chat.chatInputPlaceholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="from-primary-start to-primary-end rounded-xl bg-gradient-to-r disabled:opacity-50"
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
