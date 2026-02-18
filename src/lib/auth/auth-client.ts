import type { TokenResponse, UserInfo } from "@/lib/types";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8100";
const CLIENT_ID = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || "";

export function getOAuthRedirectUrl(): string {
  const redirectUri = `${window.location.origin}/auth/callback`;
  return `${AUTH_URL}/auth/oauth/github?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_URL}/auth/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, client_id: CLIENT_ID }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Token exchange failed (${res.status})`);
  }
  return res.json();
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_URL}/auth/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    throw new Error("Token refresh failed");
  }
  return res.json();
}

export async function revokeToken(refreshToken: string): Promise<void> {
  await fetch(`${AUTH_URL}/auth/token/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {});
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const res = await fetch(`${AUTH_URL}/auth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch user info");
  }
  return res.json();
}
