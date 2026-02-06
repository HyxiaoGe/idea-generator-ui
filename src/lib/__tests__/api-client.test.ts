import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, ApiClient, getApiClient, setApiClient } from "../api-client";

describe("ApiError", () => {
  it("has correct name, status, message, and detail", () => {
    const error = new ApiError(404, "Not found", { detail: "missing" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.detail).toEqual({ detail: "missing" });
  });

  it("works without detail", () => {
    const error = new ApiError(500, "Server error");
    expect(error.detail).toBeUndefined();
  });
});

describe("ApiClient", () => {
  let client: ApiClient;
  let mockToken: string | null;
  let onUnauthorized: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    mockToken = "test-token";
    onUnauthorized = vi.fn();
    client = new ApiClient({
      baseUrl: "https://api.test.com",
      getToken: () => mockToken,
      onUnauthorized,
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(response: Partial<Response>) {
    const defaults = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    };
    vi.mocked(fetch).mockResolvedValue({ ...defaults, ...response } as Response);
  }

  it("sends Authorization header when token is present", async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: 1 }) });

    await client.getMe();

    expect(fetch).toHaveBeenCalledWith(
      "https://api.test.com/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("does not send Authorization header when token is null", async () => {
    mockToken = null;
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve({}) });

    await client.getMe();

    const callHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(callHeaders).not.toHaveProperty("Authorization");
  });

  it("throws ApiError on non-ok response", async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "server broke" }),
    });

    await expect(client.getMe()).rejects.toThrow(ApiError);
    await expect(client.getMe()).rejects.toMatchObject({
      status: 500,
      message: "server broke",
    });
  });

  it("calls onUnauthorized on 401", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(client.getMe()).rejects.toThrow(ApiError);
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("handles 204 No Content", async () => {
    mockFetch({ ok: true, status: 204 });

    const result = await client.deleteHistoryItem("123");
    expect(result).toBeUndefined();
  });

  it("sends X-Provider and X-Model headers for generation", async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve({}) });

    await client.generateImage({ prompt: "test" } as never, "openai", "dall-e-3");

    const callHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(callHeaders["X-Provider"]).toBe("openai");
    expect(callHeaders["X-Model"]).toBe("dall-e-3");
  });

  it("builds query params for getHistory", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });

    await client.getHistory({ limit: 10, offset: 5, type: "image" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=5");
    expect(url).toContain("type=image");
  });
});

describe("getApiClient / setApiClient", () => {
  it("returns a default client if none is set", () => {
    const client = getApiClient();
    expect(client).toBeInstanceOf(ApiClient);
  });

  it("returns the client that was set", () => {
    const custom = new ApiClient({ getToken: () => "custom" });
    setApiClient(custom);
    expect(getApiClient()).toBe(custom);
  });
});
