import { toast } from "sonner";
import { ApiError } from "./api-client";

const ERROR_MAP: Record<string, { type: "error" | "warning"; title: string; description: string }> =
  {
    quota_exceeded: { type: "warning", title: "配额已用完", description: "请等待明天重置" },
    content_blocked: { type: "error", title: "内容不合规", description: "请修改提示词后重试" },
    model_unavailable: {
      type: "error",
      title: "模型暂不可用",
      description: "建议换个模型或稍后重试",
    },
    rate_limit_exceeded: { type: "warning", title: "请求过快", description: "请稍等片刻后重试" },
    external_service_error: { type: "error", title: "服务暂时故障", description: "请稍后重试" },
    generation_timeout: { type: "error", title: "生成超时", description: "可尝试重试或降低分辨率" },
    validation_error: { type: "error", title: "参数错误", description: "" },
  };

export function showErrorToast(error: unknown, fallbackTitle = "操作失败") {
  if (error instanceof ApiError && error.errorCode) {
    const mapped = ERROR_MAP[error.errorCode];
    if (mapped) {
      const description =
        error.errorCode === "validation_error" && error.details
          ? Object.values(error.details).join("; ")
          : mapped.description || error.message;
      toast[mapped.type](mapped.title, { description });
      return;
    }
  }

  // Fallback: generic
  const message = error instanceof Error ? error.message : "请重试";
  toast.error(fallbackTitle, { description: message });
}
