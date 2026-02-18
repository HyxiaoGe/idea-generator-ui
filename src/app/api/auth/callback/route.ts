import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    // Forward to backend
    const backendRes = await fetch(`${API_BASE}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ detail: "Auth failed" }));
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();

    // Create response with access_token in body
    const response = NextResponse.json({
      access_token: data.access_token,
      user: data.user,
    });

    // Store access_token in httpOnly cookie for session persistence across refreshes.
    // The backend has no refresh token — its /auth/refresh endpoint takes a valid
    // JWT Bearer token and returns a new one. We store the JWT here so the
    // server-side refresh route can present it to the backend.
    if (data.access_token) {
      response.cookies.set("auth_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend JWT expiry)
      });
    }

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
