import { toast } from "sonner";
import { ApiError } from "./api-client";
import { getTranslations } from "@/lib/i18n";

export function showErrorToast(error: unknown, fallbackTitle?: string) {
  const t = getTranslations();

  const ERROR_MAP: Record<
    string,
    { type: "error" | "warning"; title: string; description: string }
  > = {
    quota_exceeded: {
      type: "warning",
      title: t.errors.quotaExceeded,
      description: t.errors.quotaExceededDesc,
    },
    content_blocked: {
      type: "error",
      title: t.errors.contentBlocked,
      description: t.errors.contentBlockedDesc,
    },
    model_unavailable: {
      type: "error",
      title: t.errors.modelUnavailable,
      description: t.errors.modelUnavailableDesc,
    },
    rate_limit_exceeded: {
      type: "warning",
      title: t.errors.rateLimited,
      description: t.errors.rateLimitedDesc,
    },
    external_service_error: {
      type: "error",
      title: t.errors.serviceError,
      description: t.errors.serviceErrorDesc,
    },
    generation_timeout: {
      type: "error",
      title: t.errors.generationTimeout,
      description: t.errors.generationTimeoutDesc,
    },
    validation_error: { type: "error", title: t.errors.validationError, description: "" },
  };

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
  const message = error instanceof Error ? error.message : t.errors.fallbackMessage;
  toast.error(fallbackTitle || t.errors.fallbackTitle, { description: message });
}
