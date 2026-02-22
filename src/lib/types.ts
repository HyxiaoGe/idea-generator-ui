// ===== Enums / Literal Types =====

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type Resolution = "1K" | "2K" | "4K";
export type SafetyLevel = "strict" | "moderate" | "relaxed" | "none";
export type GenerationMode =
  | "basic"
  | "chat"
  | "batch"
  | "blend"
  | "style"
  | "search"
  | "inpaint"
  | "outpaint";
export type QualityPreset = "premium" | "balanced" | "fast";
export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type MaskMode = "user_provided" | "foreground" | "background" | "semantic";
export type DescribeMode = "describe" | "reverse_prompt";
export type DetailLevel = "brief" | "standard" | "detailed";

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

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_superuser: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
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
  enhance_prompt?: boolean;
  generate_negative?: boolean;
  template_id?: string;
  quality_preset?: QualityPreset;
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
  processed_prompt?: string;
  negative_prompt?: string;
  thinking?: string;
  text_response?: string;
  duration: number;
  mode: GenerationMode;
  settings: GenerationSettings;
  created_at: string;
  provider?: string;
  model?: string;
  model_used?: string;
  model_display_name?: string;
  quality_preset?: string;
  search_sources?: string;
}

// ===== Async Generation =====

export interface AsyncGenerateResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface GenerateTaskProgress {
  task_id: string;
  task_type: "single" | "batch";
  status: string;
  progress: number;
  // Single fields
  stage?: string;
  provider?: string;
  result?: GenerateImageResponse;
  // Batch fields
  total?: number;
  current_prompt?: string;
  results?: GeneratedImage[];
  errors?: string[];
  // Common
  error?: string;
  error_code?: string;
  started_at?: string;
  completed_at?: string;
}

// ===== Batch Generation =====

export interface BatchGenerateRequest {
  prompts: string[];
  settings?: Partial<GenerationSettings>;
  enhance_prompt?: boolean;
  template_id?: string;
  quality_preset?: QualityPreset;
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

// ===== Blend / Inpaint / Outpaint / Describe =====

export interface BlendImagesRequest {
  image_keys: string[];
  blend_prompt?: string;
  settings?: Partial<GenerationSettings>;
}

export interface InpaintRequest {
  image_key: string;
  prompt: string;
  mask_key?: string;
  mask_mode?: MaskMode;
  mask_dilation?: number;
  remove_mode?: boolean;
  negative_prompt?: string;
  settings?: Partial<GenerationSettings>;
}

export interface OutpaintRequest {
  image_key: string;
  mask_key: string;
  prompt?: string;
  negative_prompt?: string;
  settings?: Partial<GenerationSettings>;
}

export interface DescribeImageRequest {
  image_key: string;
  mode?: DescribeMode;
  detail_level?: DetailLevel;
  include_tags?: boolean;
  language?: string;
}

export interface DescribeImageResponse {
  description: string;
  prompt?: string;
  tags: string[];
  duration: number;
  provider?: string;
  model?: string;
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

export interface AsyncChatResponse {
  task_id: string;
  status: string;
}

export interface ChatTaskProgress {
  task_id: string;
  status: string;
  stage?: string;
  progress: number;
  result?: SendMessageResponse;
  error?: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  aspect_ratio: string;
}

// ===== Quota =====

export interface QuotaStatusResponse {
  date?: string;
  used: number;
  limit: number;
  remaining: number;
  cooldown_active: boolean;
  cooldown_remaining: number;
  resets_at?: string;
}

export interface QuotaCheckResponse {
  can_generate: boolean;
  reason?: string;
  cost: number;
  remaining_after: number;
}

export interface QuotaConfigResponse {
  daily_limit: number;
  cooldown_seconds: number;
  max_batch_size: number;
}

// ===== History =====

export interface HistoryItem {
  id: string;
  filename: string;
  url?: string;
  thumbnail?: string;
  r2_key?: string;
  prompt: string;
  mode: string;
  settings?: GenerationSettings;
  duration?: number;
  created_at: string;
  text_response?: string | null;
  thinking?: string | null;
  session_id?: string | null;
  favorite?: boolean;
  favorite_id?: string;
  image_id?: string;
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

// ===== Favorites =====

export interface ImageInfo {
  id: string;
  filename: string;
  prompt: string;
  url?: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface FavoriteInfo {
  id: string;
  image: ImageInfo;
  folder_id?: string;
  folder_name?: string;
  note?: string;
  created_at: string;
}

export interface AddFavoriteRequest {
  image_id: string;
  folder_id?: string;
  note?: string;
}

// ===== Chat Sessions =====

export interface ChatSessionInfo {
  session_id: string;
  aspect_ratio: string;
  message_count: number;
  created_at: string;
  last_activity: string;
}

export interface ListChatsResponse {
  sessions: ChatSessionInfo[];
  total: number;
}

// ===== Preferences (powered by prefhub) =====

export type Language = "zh-CN" | "en" | "ja";
export type Theme = "system" | "light" | "dark";
export type HourCycle = "auto" | "h12" | "h23";
export type RoutingStrategy =
  | "priority"
  | "cost"
  | "quality"
  | "speed"
  | "round_robin"
  | "adaptive";

export interface UIPreferences {
  language: Language;
  theme: Theme;
  timezone: string;
  hour_cycle: HourCycle;
}

export interface NotificationPreferences {
  enabled: boolean;
  task_completed: boolean;
  task_failed: boolean;
  sound: boolean;
}

export interface GenerationDefaults {
  default_aspect_ratio?: string;
  default_resolution?: string;
  default_provider?: string;
  routing_strategy?: RoutingStrategy;
}

export interface ProviderPreference {
  provider: string;
  enabled: boolean;
  priority: number;
  max_daily_usage?: number;
}

export interface ProviderPreferences {
  providers: ProviderPreference[];
  fallback_enabled: boolean;
}

export interface UserPreferences {
  ui: UIPreferences;
  notifications: NotificationPreferences;
  extra: Record<string, unknown>;
  generation: GenerationDefaults;
  providers: ProviderPreferences;
}

export interface APISettings {
  webhook_url?: string;
  webhook_secret?: string;
  max_concurrent_requests?: number;
}

export interface GetPreferencesResponse {
  preferences: UserPreferences;
  api_settings: APISettings;
  updated_at?: string;
}

export interface UpdatePreferencesRequest {
  preferences?: {
    ui?: Partial<UIPreferences>;
    notifications?: Partial<NotificationPreferences>;
    generation?: Partial<GenerationDefaults>;
    providers?: Partial<ProviderPreferences>;
    extra?: Record<string, unknown>;
  };
  api_settings?: Partial<APISettings>;
}

// ===== Templates (Prompt Library) =====

/** List item returned by /templates, /templates/recommended, /templates/favorites */
export interface TemplateListItem {
  id: string;
  display_name_en: string;
  display_name_zh: string;
  description_en?: string;
  description_zh?: string;
  preview_image_url?: string;
  preview_4k_url?: string;
  preview_storage_key?: string;
  category: string;
  tags: string[];
  difficulty: string;
  media_type: "image" | "video";
  use_count: number;
  like_count: number;
  favorite_count: number;
  source: string;
  trending_score: number;
  created_at: string;
}

/** Detail returned by GET /templates/{id} and POST /templates/{id}/use */
export interface TemplateDetailResponse {
  id: string;
  prompt_text: string;
  display_name_en: string;
  display_name_zh: string;
  description_en?: string;
  description_zh?: string;
  preview_image_url?: string;
  preview_4k_url?: string;
  preview_storage_key?: string;
  category: string;
  tags: string[];
  style_keywords: string[];
  parameters: Record<string, unknown>;
  difficulty: string;
  media_type: "image" | "video";
  language: string;
  source: string;
  use_count: number;
  like_count: number;
  favorite_count: number;
  trending_score: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  is_favorited: boolean;
}

/** Paginated list from /templates */
export interface TemplateListResponse {
  items: TemplateListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface TemplateCategoryInfo {
  category: string;
  count: number;
}

export interface ToggleResponse {
  action: "added" | "removed";
  count: number;
}

// ===== Generated Image Info (homepage display) =====

export interface GeneratedImageInfo {
  url: string;
  provider?: string;
  model?: string;
  model_display_name?: string;
  duration?: number;
  mode?: string;
  settings?: { aspect_ratio: string; resolution: string };
  processed_prompt?: string;
  width?: number;
  height?: number;
  created_at?: string;
}

// ===== Models / Quality Presets =====

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  provider_display_name: string;
  tier: string;
  arena_rank: number | null;
  pricing_per_image: number;
  speed: string;
  strengths: string[];
}

export interface PresetInfo {
  id: QualityPreset;
  name_zh: string;
  name_en: string;
  description_zh: string;
  icon: string;
  is_default?: boolean;
}

export interface ModelsResponse {
  presets: PresetInfo[];
  models: ModelInfo[];
}
