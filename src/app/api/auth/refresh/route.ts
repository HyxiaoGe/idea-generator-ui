import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!backendRes.ok) {
      const response = NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
      // Clear invalid refresh token
      response.cookies.delete("refresh_token");
      return response;
    }

    const data = await backendRes.json();

    const response = NextResponse.json({
      access_token: data.access_token,
    });

    // Update refresh token cookie if a new one is provided
    if (data.refresh_token) {
      response.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
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
  response.cookies.delete("refresh_token");
  return response;
}
