// ===== Enums / Literal Types =====

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type Resolution = "1K" | "2K" | "4K";
export type SafetyLevel = "strict" | "moderate" | "relaxed" | "none";
export type GenerationMode = "basic" | "chat" | "batch" | "blend" | "style" | "search";
export type HealthStatus = "healthy" | "degraded" | "unhealthy";

// ===== Generic =====

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ===== Auth =====

export interface GitHubUser {
  id: string;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  user_folder_id: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: GitHubUser;
}

export interface APIKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  scopes?: string[];
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  is_expired: boolean;
}

// ===== Image Generation =====

export interface GenerationSettings {
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  safety_level: SafetyLevel;
}

export interface GenerateImageRequest {
  prompt: string;
  settings?: Partial<GenerationSettings>;
  include_thinking?: boolean;
}

export interface GeneratedImage {
  key: string;
  filename: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface GenerateImageResponse {
  image: GeneratedImage;
  prompt: string;
  thinking?: string;
  text_response?: string;
  duration: number;
  mode: GenerationMode;
  settings: GenerationSettings;
  created_at: string;
  provider?: string;
  model?: string;
  search_sources?: string;
}

// ===== Batch Generation =====

export interface BatchGenerateRequest {
  prompts: string[];
  settings?: Partial<GenerationSettings>;
}

export interface BatchGenerateResponse {
  task_id: string;
  total: number;
  status: "queued" | "processing" | "completed" | "failed";
}

export interface TaskProgress {
  task_id: string;
  status: string;
  progress: number;
  total: number;
  current_prompt?: string;
  results: GeneratedImage[];
  errors: string[];
  started_at?: string;
  completed_at?: string;
}

// ===== Chat =====

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: GeneratedImage;
  thinking?: string;
  timestamp: string;
}

export interface SendMessageRequest {
  message: string;
  aspect_ratio?: AspectRatio;
  safety_level?: SafetyLevel;
}

export interface SendMessageResponse {
  text?: string;
  image?: GeneratedImage;
  thinking?: string;
  duration: number;
  message_count: number;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  aspect_ratio: string;
}

// ===== Quota =====

export interface ModeQuota {
  name: string;
  used: number;
  limit: number;
  remaining: number;
  cost: number;
}

export interface QuotaStatusResponse {
  is_trial_mode: boolean;
  date?: string;
  global_used: number;
  global_limit: number;
  global_remaining: number;
  modes: Record<string, ModeQuota>;
  cooldown_active: boolean;
  cooldown_remaining: number;
  resets_at?: string;
}

// ===== History =====

export interface HistoryItem {
  id: string;
  type: "image" | "video";
  url?: string;
  thumbnail?: string;
  prompt: string;
  mode: GenerationMode;
  settings?: GenerationSettings;
  created_at: string;
  favorite: boolean;
  provider?: string;
  model?: string;
}

// ===== Templates =====

export interface Template {
  id: string;
  title: string;
  prompt: string;
  image?: string;
  category: string;
  trending: boolean;
  uses: number;
}

// ===== Providers =====

export interface ProviderInfo {
  name: string;
  display_name: string;
  models: ProviderModel[];
  status: HealthStatus;
}

export interface ProviderModel {
  id: string;
  name: string;
  capabilities?: string[];
}
