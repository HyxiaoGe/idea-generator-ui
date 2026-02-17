import type {
  TokenResponse,
  GitHubUser,
  GenerateImageRequest,
  GenerateImageResponse,
  BatchGenerateRequest,
  BatchGenerateResponse,
  TaskProgress,
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
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void;

  constructor(config: {
    baseUrl?: string;
    getToken: () => string | null;
    onUnauthorized?: () => void;
  }) {
    this.baseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
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
    }
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });

    if (response.status === 401) {
      this.onUnauthorized();
      throw new ApiError(401, "Unauthorized");
    }

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        // response body not JSON
      }
      const message =
        detail && typeof detail === "object" && "detail" in detail
          ? String((detail as { detail: unknown }).detail)
          : `HTTP ${response.status}`;
      throw new ApiError(response.status, message, detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ===== Auth =====

  async getLoginUrl(): Promise<{ url: string; state: string }> {
    return this.request("GET", "/auth/login");
  }

  async authCallback(code: string, state: string): Promise<TokenResponse> {
    return this.request("POST", "/auth/callback", {
      body: { code, state },
    });
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    return this.request("POST", "/auth/refresh", {
      body: { refresh_token: refreshToken },
    });
  }

  async getMe(): Promise<GitHubUser> {
    return this.request("GET", "/auth/me");
  }

  // ===== Generation =====

  async generateImage(
    req: GenerateImageRequest,
    provider?: string,
    model?: string
  ): Promise<GenerateImageResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate", { body: req, headers });
  }

  async generateWithSearch(
    req: GenerateImageRequest,
    provider?: string,
    model?: string
  ): Promise<GenerateImageResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/search", { body: req, headers });
  }

  async batchGenerate(
    req: BatchGenerateRequest,
    provider?: string,
    model?: string
  ): Promise<BatchGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/generate/batch", { body: req, headers });
  }

  async getTaskProgress(taskId: string): Promise<TaskProgress> {
    return this.request("GET", `/generate/task/${taskId}`);
  }

  async getProviders(): Promise<ProviderInfo[]> {
    return this.request("GET", "/generate/providers");
  }

  // ===== Video =====

  async generateVideo(
    req: GenerateImageRequest,
    provider?: string,
    model?: string
  ): Promise<BatchGenerateResponse> {
    const headers: Record<string, string> = {};
    if (provider) headers["X-Provider"] = provider;
    if (model) headers["X-Model"] = model;
    return this.request("POST", "/video/generate", { body: req, headers });
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
