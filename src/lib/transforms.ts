/**
 * Format an ISO timestamp to a relative time string in Chinese.
 * e.g. "2小时前", "3天前", "刚刚"
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}个月前`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}年前`;
}

/**
 * Map backend generation mode to Chinese display name.
 */
export function getModeDisplayName(mode: string): string {
  const modeMap: Record<string, string> = {
    basic: "基础",
    chat: "对话",
    batch: "批量",
    blend: "混合",
    style: "风格迁移",
    search: "搜索增强",
  };
  return modeMap[mode] || mode;
}

/**
 * Map a frontend model selector value to provider + model for API headers.
 */
export function getProviderAndModel(frontendModel: string): {
  provider: string;
  model: string;
} {
  // Expected format: "provider:model", e.g. "google:gemini-3-pro-image-preview"
  const [provider, ...rest] = frontendModel.split(":");
  return { provider, model: rest.join(":") || provider };
}

/**
 * Map frontend resolution string to backend Resolution enum.
 */
export function mapResolution(frontendRes: string): "1K" | "2K" | "4K" {
  const resMap: Record<string, "1K" | "2K" | "4K"> = {
    "512": "1K",
    "1k": "1K",
    "1024": "1K",
    "2k": "2K",
    "2048": "2K",
    "4k": "4K",
    "4096": "4K",
  };
  return resMap[frontendRes.toLowerCase()] || "1K";
}

/**
 * Build an image URL from a GeneratedImage key or url.
 * If the image already has a full URL, return it.
 * Otherwise, construct one from the API base.
 */
export function getImageUrl(urlOrKey: string | undefined): string {
  if (!urlOrKey) return "";
  if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
    return urlOrKey;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  return `${base}/files/${urlOrKey}`;
}
