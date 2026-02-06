import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelativeTime,
  getModeDisplayName,
  getProviderAndModel,
  mapResolution,
  getImageUrl,
} from "../transforms";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 刚刚 for less than 60 seconds ago", () => {
    expect(formatRelativeTime("2025-01-15T11:59:30Z")).toBe("刚刚");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime("2025-01-15T11:55:00Z")).toBe("5分钟前");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime("2025-01-15T09:00:00Z")).toBe("3小时前");
  });

  it("returns days ago", () => {
    expect(formatRelativeTime("2025-01-13T12:00:00Z")).toBe("2天前");
  });

  it("returns months ago", () => {
    expect(formatRelativeTime("2024-10-15T12:00:00Z")).toBe("3个月前");
  });

  it("returns years ago", () => {
    expect(formatRelativeTime("2023-01-15T12:00:00Z")).toBe("2年前");
  });
});

describe("getModeDisplayName", () => {
  it("returns Chinese name for known modes", () => {
    expect(getModeDisplayName("basic")).toBe("基础");
    expect(getModeDisplayName("chat")).toBe("对话");
    expect(getModeDisplayName("batch")).toBe("批量");
    expect(getModeDisplayName("blend")).toBe("混合");
    expect(getModeDisplayName("style")).toBe("风格迁移");
    expect(getModeDisplayName("search")).toBe("搜索增强");
  });

  it("returns the raw mode string for unknown modes", () => {
    expect(getModeDisplayName("unknown")).toBe("unknown");
  });
});

describe("getProviderAndModel", () => {
  it("parses provider:model format", () => {
    expect(getProviderAndModel("google:gemini-3-pro-image-preview")).toEqual({
      provider: "google",
      model: "gemini-3-pro-image-preview",
    });
    expect(getProviderAndModel("kling:kling-2.0-pro")).toEqual({
      provider: "kling",
      model: "kling-2.0-pro",
    });
  });

  it("handles model IDs containing colons", () => {
    expect(getProviderAndModel("google:some:model:v2")).toEqual({
      provider: "google",
      model: "some:model:v2",
    });
  });

  it("uses input as provider when no colon present", () => {
    expect(getProviderAndModel("unknown")).toEqual({
      provider: "unknown",
      model: "unknown",
    });
  });
});

describe("mapResolution", () => {
  it("maps numeric strings to resolution", () => {
    expect(mapResolution("512")).toBe("1K");
    expect(mapResolution("1024")).toBe("1K");
    expect(mapResolution("2048")).toBe("2K");
    expect(mapResolution("4096")).toBe("4K");
  });

  it("maps k-notation strings", () => {
    expect(mapResolution("1k")).toBe("1K");
    expect(mapResolution("2k")).toBe("2K");
    expect(mapResolution("4k")).toBe("4K");
  });

  it("is case-insensitive", () => {
    expect(mapResolution("1K")).toBe("1K");
    expect(mapResolution("2K")).toBe("2K");
    expect(mapResolution("4K")).toBe("4K");
  });

  it("defaults to 1K for unknown input", () => {
    expect(mapResolution("unknown")).toBe("1K");
  });
});

describe("getImageUrl", () => {
  it("returns empty string for undefined/empty input", () => {
    expect(getImageUrl(undefined)).toBe("");
    expect(getImageUrl("")).toBe("");
  });

  it("returns full URL unchanged", () => {
    expect(getImageUrl("https://example.com/img.png")).toBe("https://example.com/img.png");
    expect(getImageUrl("http://example.com/img.png")).toBe("http://example.com/img.png");
  });

  it("constructs URL from key using API base", () => {
    const result = getImageUrl("abc123");
    expect(result).toMatch(/\/files\/abc123$/);
  });
});
