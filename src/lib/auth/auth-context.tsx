"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
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

  // Refs to avoid recreating ApiClient on every render
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const onUnauthorizedRef = useRef<() => void>(() => {});

  // Create ApiClient once via useRef — reads token/callback through refs
  const apiClientRef = useRef<ApiClient | null>(null);
  if (!apiClientRef.current) {
    apiClientRef.current = new ApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => onUnauthorizedRef.current(),
    });
  }
  const apiClient = apiClientRef.current;

  // Register as global singleton once
  useEffect(() => {
    setApiClient(apiClient);
  }, [apiClient]);

  const performLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("user");
    // Clear refresh token cookie via API route
    fetch("/api/auth/refresh", { method: "DELETE" }).catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      setToken(data.access_token);
      return data.access_token;
    } catch {
      throw new Error("Refresh failed");
    }
  }, []);

  // Keep onUnauthorized ref current — assign during render for concurrent mode safety
  onUnauthorizedRef.current = () => {
    handleRefresh().catch(() => {
      performLogout();
    });
  };

  // Helper: update user state and persist to sessionStorage
  const updateUser = useCallback((me: GitHubUser) => {
    setUser(me);
    sessionStorage.setItem("user", JSON.stringify(me));
  }, []);

  // On mount: try to restore session
  useEffect(() => {
    const init = async () => {
      // Restore cached user immediately (avoids avatar flash)
      const cachedUser = sessionStorage.getItem("user");
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          sessionStorage.removeItem("user");
        }
      }

      // Always refresh from httpOnly cookie
      try {
        const newToken = await handleRefresh();
        const tempClient = new ApiClient({
          getToken: () => newToken,
        });
        const me = await tempClient.getMe();
        updateUser(me);
      } catch {
        // Not logged in, that's fine
        if (cachedUser) performLogout(); // clear stale cache
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
  const setAuthToken = useCallback(
    (newToken: string, newUser: GitHubUser) => {
      setToken(newToken);
      updateUser(newUser);
    },
    [updateUser]
  );

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
