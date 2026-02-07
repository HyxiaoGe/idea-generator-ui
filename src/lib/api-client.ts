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
  Template,
  APIKeyInfo,
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
  }): Promise<PaginatedResponse<HistoryItem>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.type) searchParams.set("type", params.type);
    if (params?.mode) searchParams.set("mode", params.mode);
    const query = searchParams.toString();
    return this.request("GET", `/history${query ? `?${query}` : ""}`);
  }

  async deleteHistoryItem(id: string): Promise<void> {
    return this.request("DELETE", `/history/${id}`);
  }

  // ===== Favorites =====

  async getFavorites(): Promise<HistoryItem[]> {
    return this.request("GET", "/favorites");
  }

  async addFavorite(historyId: string): Promise<void> {
    return this.request("POST", "/favorites", { body: { history_id: historyId } });
  }

  async removeFavorite(historyId: string): Promise<void> {
    return this.request("DELETE", `/favorites/${historyId}`);
  }

  // ===== Templates =====

  async getTemplates(params?: { category?: string }): Promise<Template[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    const query = searchParams.toString();
    return this.request("GET", `/templates${query ? `?${query}` : ""}`);
  }

  async useTemplate(id: string): Promise<void> {
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
