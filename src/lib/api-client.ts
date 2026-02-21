import type {
  GenerateImageRequest,
  GenerateImageResponse,
  AsyncGenerateResponse,
  GenerateTaskProgress,
  BatchGenerateRequest,
  BatchGenerateResponse,
  BlendImagesRequest,
  InpaintRequest,
  OutpaintRequest,
  DescribeImageRequest,
  DescribeImageResponse,
  ProviderInfo,
  SendMessageResponse,
  ChatHistoryResponse,
  QuotaStatusResponse,
  QuotaCheckResponse,
  QuotaConfigResponse,
  PaginatedResponse,
  HistoryItem,
  APIKeyInfo,
  FavoriteInfo,
  AddFavoriteRequest,
  ListChatsResponse,
  GetPreferencesResponse,
  UpdatePreferencesRequest,
  TemplateListItem,
  TemplateListResponse,
  TemplateDetailResponse,
  TemplateCategoryInfo,
  ToggleResponse,
  ModelsResponse,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
    public errorCode?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface CancelTaskResponse {
  success: boolean;
  task_id: string;
  status: string;
  quota_refunded: boolean;
  refunded_count: number;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void | Promise<void>;

  constructor(config: {
    baseUrl?: string;
    getToken: () => string | null;
    onUnauthorized?: () => void | Promise<void>;
  }) {
    this.baseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888/api";
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized || (() => {});
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
      timeout?: number;
    },
    _isRetry = false
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use caller-provided signal, or create a timeout signal (default 60s)
    const timeout = options?.timeout ?? 60_000;
    let signal = options?.signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!signal && timeout > 0) {
      const controller = new AbortController();
      signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (response.status === 401 && !_isRetry) {
      await this.onUnauthorized();
      return this.request(method, path, options, true);
    }

    if (response.status === 401) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        // response body not JSON
      }

      let message = `HTTP ${response.status}`;
      let errorCode: string | undefined;
      let details: Record<string, unknown> | undefined;

      if (detail && typeof detail === "object") {
        const obj = detail as Record<string, unknown>;
        if (obj.error && typeof obj.error === "object") {
          // New format: { success: false, error: { code, message, details } }
          const err = obj.error as Record<string, unknown>;
          message = String(err.message || message);
          errorCode = err.code as string | undefined;
          details = err.details as Record<string, unknown> | undefined;
        } else if ("detail" in obj) {
          // Old format: { detail: "..." }
          message = String(obj.detail);
        }
      }

      throw new ApiError(response.status, message, detail, errorCode, details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Public GET for SWR fetcher
  async get<T = unknown>(path: string): Promise<T> {
    return this.request("GET", path);
  }

  // ===== Generation =====

  async generateImage(
    req: GenerateImageRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<AsyncGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate", { body: req, headers, signal });
  }

  async generateWithSearch(
    req: GenerateImageRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<GenerateImageResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/search", { body: req, headers, signal });
  }

  async batchGenerate(
    req: BatchGenerateRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<BatchGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/batch", { body: req, headers, signal });
  }

  async blendImages(
    req: BlendImagesRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<AsyncGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/blend", { body: req, headers, signal });
  }

  async inpaint(
    req: InpaintRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<AsyncGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/inpaint", { body: req, headers, signal });
  }

  async outpaint(
    req: OutpaintRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<AsyncGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/outpaint", { body: req, headers, signal });
  }

  async describeImage(
    req: DescribeImageRequest,
    signal?: AbortSignal
  ): Promise<DescribeImageResponse> {
    return this.request("POST", "/generate/describe", { body: req, signal });
  }

  async getTaskProgress(taskId: string): Promise<GenerateTaskProgress> {
    return this.request("GET", `/generate/task/${taskId}`);
  }

  async cancelTask(taskId: string): Promise<CancelTaskResponse> {
    return this.request("POST", `/tasks/${taskId}/cancel`);
  }

  async getProviders(): Promise<ProviderInfo[]> {
    return this.request("GET", "/generate/providers");
  }

  async getModels(): Promise<ModelsResponse> {
    return this.request("GET", "/models");
  }

  // ===== Video =====

  async generateVideo(
    req: GenerateImageRequest,
    provider?: string,
    model?: string,
    signal?: AbortSignal
  ): Promise<BatchGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/video/generate", { body: req, headers, signal });
  }

  // ===== Chat =====

  async createChat(aspectRatio?: string): Promise<{ session_id: string }> {
    return this.request("POST", "/chat", {
      body: aspectRatio ? { aspect_ratio: aspectRatio } : {},
    });
  }

  async sendMessage(
    sessionId: string,
    message: string,
    options?: { aspect_ratio?: string; safety_level?: string }
  ): Promise<SendMessageResponse> {
    return this.request("POST", `/chat/${sessionId}/message`, {
      body: { message, ...options },
    });
  }

  async getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
    return this.request("GET", `/chat/${sessionId}`);
  }

  // ===== History / Gallery =====

  async getHistory(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    mode?: string;
    search?: string;
  }): Promise<PaginatedResponse<HistoryItem>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.type) searchParams.set("type", params.type);
    if (params?.mode) searchParams.set("mode", params.mode);
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return this.request("GET", `/history${query ? `?${query}` : ""}`);
  }

  async deleteHistoryItem(id: string): Promise<void> {
    return this.request("DELETE", `/history/${id}`);
  }

  // ===== Favorites =====

  async getFavorites(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<FavoriteInfo>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    const query = searchParams.toString();
    return this.request("GET", `/favorites${query ? `?${query}` : ""}`);
  }

  async addFavorite(
    imageId: string,
    options?: { folder_id?: string; note?: string }
  ): Promise<void> {
    const body: AddFavoriteRequest = { image_id: imageId, ...options };
    return this.request("POST", "/favorites", { body });
  }

  async removeFavorite(favoriteId: string): Promise<void> {
    return this.request("DELETE", `/favorites/${favoriteId}`);
  }

  // ===== Chat Management =====

  async listChats(): Promise<ListChatsResponse> {
    return this.request("GET", "/chat");
  }

  async deleteChat(sessionId: string): Promise<void> {
    return this.request("DELETE", `/chat/${sessionId}`);
  }

  // ===== Preferences =====

  async getPreferences(): Promise<GetPreferencesResponse> {
    return this.request("GET", "/preferences");
  }

  async updatePreferences(req: UpdatePreferencesRequest): Promise<GetPreferencesResponse> {
    return this.request("PUT", "/preferences", { body: req });
  }

  // ===== Templates =====

  async getTemplates(params?: {
    category?: string;
    tags?: string;
    difficulty?: string;
    search?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.tags) searchParams.set("tags", params.tags);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.page_size) searchParams.set("page_size", params.page_size.toString());
    const query = searchParams.toString();
    return this.request("GET", `/templates${query ? `?${query}` : ""}`);
  }

  async getTemplateCategories(): Promise<TemplateCategoryInfo[]> {
    return this.request("GET", "/templates/categories");
  }

  async getTemplateFavorites(): Promise<TemplateListItem[]> {
    return this.request("GET", "/templates/favorites");
  }

  async getRecommendedTemplates(params?: {
    based_on?: string;
    limit?: number;
  }): Promise<TemplateListItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.based_on) searchParams.set("based_on", params.based_on);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    const query = searchParams.toString();
    return this.request("GET", `/templates/recommended${query ? `?${query}` : ""}`);
  }

  async getTemplate(id: string): Promise<TemplateDetailResponse> {
    return this.request("GET", `/templates/${id}`);
  }

  async toggleTemplateLike(id: string): Promise<ToggleResponse> {
    return this.request("POST", `/templates/${id}/like`);
  }

  async toggleTemplateFavorite(id: string): Promise<ToggleResponse> {
    return this.request("POST", `/templates/${id}/favorite`);
  }

  async useTemplate(id: string): Promise<TemplateDetailResponse> {
    return this.request("POST", `/templates/${id}/use`);
  }

  // ===== Quota =====

  async getQuota(): Promise<QuotaStatusResponse> {
    return this.request("GET", "/quota");
  }

  async checkQuota(count: number = 1): Promise<QuotaCheckResponse> {
    return this.request("POST", "/quota/check", { body: { count } });
  }

  async getQuotaConfig(): Promise<QuotaConfigResponse> {
    return this.request("GET", "/quota/config");
  }

  // ===== API Keys =====

  async getApiKeys(): Promise<APIKeyInfo[]> {
    return this.request("GET", "/auth/api-keys");
  }

  async createApiKey(name: string): Promise<{ key: string }> {
    return this.request("POST", "/auth/api-keys", { body: { name } });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request("DELETE", `/auth/api-keys/${id}`);
  }
}

// Singleton instance — initialized lazily by AuthProvider
let _apiClient: ApiClient | null = null;

export function setApiClient(client: ApiClient) {
  _apiClient = client;
}

export function getApiClient(): ApiClient {
  if (!_apiClient) {
    // Return a default client that reads token from nowhere (pre-auth)
    _apiClient = new ApiClient({ getToken: () => null });
  }
  return _apiClient;
}
