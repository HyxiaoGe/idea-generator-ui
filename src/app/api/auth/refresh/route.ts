import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json({ detail: "No auth token" }, { status: 401 });
    }

    // The backend's /auth/refresh expects a valid JWT as Bearer token,
    // not a refresh token in the body. It returns a new JWT.
    const backendRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!backendRes.ok) {
      const response = NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
      // Clear invalid auth token
      response.cookies.delete("auth_token");
      return response;
    }

    const data = await backendRes.json();

    const response = NextResponse.json({
      access_token: data.access_token,
    });

    // Update the cookie with the new token
    if (data.access_token) {
      response.cookies.set("auth_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("auth_token");
  return response;
}
