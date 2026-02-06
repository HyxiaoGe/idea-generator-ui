"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ApiClient, setApiClient } from "@/lib/api-client";
import type { GitHubUser } from "@/lib/types";

interface AuthContextType {
  user: GitHubUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create and register the API client
  const apiClient = new ApiClient({
    getToken: () => token,
    onUnauthorized: () => {
      // Try to refresh, or logout
      handleRefresh().catch(() => {
        performLogout();
      });
    },
  });

  // Register as global singleton
  useEffect(() => {
    setApiClient(apiClient);
  }, [token]); // Re-register when token changes

  const performLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("access_token");
    // Clear refresh token cookie via API route
    fetch("/api/auth/refresh", { method: "DELETE" }).catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      setToken(data.access_token);
      sessionStorage.setItem("access_token", data.access_token);
      return data.access_token;
    } catch {
      throw new Error("Refresh failed");
    }
  }, []);

  // On mount: try to restore session
  useEffect(() => {
    const init = async () => {
      // Check sessionStorage first
      const storedToken = sessionStorage.getItem("access_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          // Verify token is still valid by fetching user
          const tempClient = new ApiClient({
            getToken: () => storedToken,
          });
          const me = await tempClient.getMe();
          setUser(me);
        } catch {
          // Token expired, try refresh
          try {
            const newToken = await handleRefresh();
            const tempClient = new ApiClient({
              getToken: () => newToken,
            });
            const me = await tempClient.getMe();
            setUser(me);
          } catch {
            performLogout();
          }
        }
      } else {
        // Try refresh from httpOnly cookie
        try {
          const newToken = await handleRefresh();
          const tempClient = new ApiClient({
            getToken: () => newToken,
          });
          const me = await tempClient.getMe();
          setUser(me);
        } catch {
          // Not logged in, that's fine
        }
      }
      setIsLoading(false);
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async () => {
    try {
      const data = await apiClient.getLoginUrl();
      sessionStorage.setItem("oauth_state", data.state);
      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to get login URL:", error);
    }
  }, [apiClient]);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  // Expose a way to set token from callback page
  const setAuthToken = useCallback((newToken: string, newUser: GitHubUser) => {
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem("access_token", newToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!token,
        isLoading,
        token,
        login,
        logout,
      }}
    >
      <AuthSetterContext.Provider value={{ setAuthToken }}>{children}</AuthSetterContext.Provider>
    </AuthContext.Provider>
  );
}

// Separate context for the setter to avoid re-renders
const AuthSetterContext = createContext<{
  setAuthToken: (token: string, user: GitHubUser) => void;
} | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthSetter() {
  const context = useContext(AuthSetterContext);
  if (!context) {
    throw new Error("useAuthSetter must be used within an AuthProvider");
  }
  return context;
}
