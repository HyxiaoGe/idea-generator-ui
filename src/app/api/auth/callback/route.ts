import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

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

    // Store refresh_token in httpOnly cookie if present
    if (data.refresh_token) {
      response.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
