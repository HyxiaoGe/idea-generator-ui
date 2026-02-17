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
 * Infer content type from filename extension.
 */
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi"]);

export function inferContentType(filename: string): "image" | "video" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
}

/**
 * Convert aspect ratio string to width/height dimensions for layout calculation.
 */
export function getAspectRatioDimensions(aspectRatio?: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1, height: 1 },
    "16:9": { width: 16, height: 9 },
    "9:16": { width: 9, height: 16 },
    "4:3": { width: 4, height: 3 },
    "3:4": { width: 3, height: 4 },
  };
  return map[aspectRatio || "1:1"] || { width: 1, height: 1 };
}

import type { FavoriteInfo, HistoryItem, Language, Template, TemplateListItem } from "./types";

/**
 * Pick the correct display name based on UI language.
 * Falls back to zh if the en field is empty.
 */
export function getTemplateDisplayName(
  template: { display_name_en: string; display_name_zh: string },
  language?: Language | string
): string {
  if (language === "en") {
    return template.display_name_en || template.display_name_zh;
  }
  return template.display_name_zh || template.display_name_en;
}

/**
 * Convert a FavoriteInfo (from /favorites API) to a HistoryItem for unified gallery rendering.
 */
export function favoriteInfoToHistoryItem(fav: FavoriteInfo): HistoryItem {
  return {
    id: fav.image.id,
    filename: fav.image.filename,
    url: fav.image.url || fav.image.thumbnail_url,
    thumbnail: fav.image.thumbnail_url,
    prompt: fav.image.prompt,
    mode: "basic",
    created_at: fav.image.created_at,
    favorite: true,
    favorite_id: fav.id,
    image_id: fav.image.id,
  };
}

/**
 * Convert a legacy Template (fallback) to a TemplateListItem for unified template rendering.
 */
export function templateToListItem(t: Template): TemplateListItem {
  return {
    id: t.id,
    display_name_en: t.title,
    display_name_zh: t.title,
    preview_image_url: t.image,
    category: t.category,
    tags: [],
    difficulty: "beginner",
    use_count: t.uses,
    like_count: 0,
    favorite_count: 0,
    source: "curated",
    trending_score: t.trending ? 100 : 0,
    created_at: new Date().toISOString(),
  };
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
