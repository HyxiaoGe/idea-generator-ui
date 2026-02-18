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
import type { UserInfo, TokenResponse } from "@/lib/types";
import { getOAuthRedirectUrl, refreshTokens, revokeToken, getUserInfo } from "./auth-client";

const LS_ACCESS_TOKEN = "access_token";
const LS_REFRESH_TOKEN = "refresh_token";
const LS_TOKEN_EXPIRY = "token_expiry";
const SS_USER = "user";

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to avoid recreating ApiClient on every render
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const onUnauthorizedRef = useRef<() => Promise<void>>(async () => {});

  // In-flight refresh promise for concurrent debounce
  const refreshPromiseRef = useRef<Promise<TokenResponse> | null>(null);

  // Timer for proactive refresh
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearTokens = useCallback(() => {
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    localStorage.removeItem(LS_TOKEN_EXPIRY);
    sessionStorage.removeItem(SS_USER);
  }, []);

  const storeTokens = useCallback((tokens: TokenResponse) => {
    const expiryMs = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem(LS_ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(LS_REFRESH_TOKEN, tokens.refresh_token);
    localStorage.setItem(LS_TOKEN_EXPIRY, String(expiryMs));
    setToken(tokens.access_token);
    tokenRef.current = tokens.access_token;
  }, []);

  // Schedule proactive refresh 60s before expiry
  const scheduleRefresh = useCallback(
    (expiryMs: number) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const delay = Math.max(expiryMs - Date.now() - 60_000, 0);
      refreshTimerRef.current = setTimeout(async () => {
        try {
          await doRefresh();
        } catch {
          // Refresh failed — will be caught on next API call
        }
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Concurrent-safe refresh: shares in-flight promise
  const doRefresh = useCallback(async (): Promise<TokenResponse> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const rt = localStorage.getItem(LS_REFRESH_TOKEN);
    if (!rt) throw new Error("No refresh token");

    const promise = refreshTokens(rt)
      .then((tokens) => {
        storeTokens(tokens);
        const expiryMs = Date.now() + tokens.expires_in * 1000;
        scheduleRefresh(expiryMs);
        refreshPromiseRef.current = null;
        return tokens;
      })
      .catch((err) => {
        refreshPromiseRef.current = null;
        throw err;
      });

    refreshPromiseRef.current = promise;
    return promise;
  }, [storeTokens, scheduleRefresh]);

  // Helper: update user state and persist to sessionStorage
  const updateUser = useCallback((me: UserInfo) => {
    setUser(me);
    sessionStorage.setItem(SS_USER, JSON.stringify(me));
  }, []);

  const performLogout = useCallback(async () => {
    const rt = localStorage.getItem(LS_REFRESH_TOKEN);
    if (rt) await revokeToken(rt);
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    clearTokens();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, [clearTokens]);

  // onUnauthorized: try to refresh then update tokenRef so the retry uses the new token
  onUnauthorizedRef.current = async () => {
    try {
      await doRefresh();
    } catch {
      performLogout();
    }
  };

  // On mount: try to restore session from localStorage
  useEffect(() => {
    const init = async () => {
      // Restore cached user immediately (avoids avatar flash)
      const cachedUser = sessionStorage.getItem(SS_USER);
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          sessionStorage.removeItem(SS_USER);
        }
      }

      const storedAccessToken = localStorage.getItem(LS_ACCESS_TOKEN);
      const storedRefreshToken = localStorage.getItem(LS_REFRESH_TOKEN);
      const storedExpiry = localStorage.getItem(LS_TOKEN_EXPIRY);

      if (!storedAccessToken || !storedRefreshToken) {
        if (cachedUser) {
          setUser(null);
          clearTokens();
        }
        setIsLoading(false);
        return;
      }

      const expiryMs = storedExpiry ? Number(storedExpiry) : 0;
      const isExpiringSoon = expiryMs - Date.now() < 60_000;

      let activeToken = storedAccessToken;

      if (isExpiringSoon) {
        try {
          const tokens = await doRefresh();
          activeToken = tokens.access_token;
        } catch {
          // Refresh failed — tokens are invalid, clear everything
          setUser(null);
          clearTokens();
          setIsLoading(false);
          return;
        }
      } else {
        setToken(storedAccessToken);
        tokenRef.current = storedAccessToken;
        scheduleRefresh(expiryMs);
      }

      try {
        const me = await getUserInfo(activeToken);
        updateUser(me);
      } catch {
        // getUserInfo failed but tokens may still be valid (network error etc.)
        // Keep cached user if available, don't clear tokens
        if (!cachedUser) {
          setUser(null);
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(() => {
    window.location.href = getOAuthRedirectUrl();
  }, []);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  // Expose a way to set tokens from callback page
  const setAuthTokens = useCallback(
    async (tokens: TokenResponse) => {
      storeTokens(tokens);
      const expiryMs = Date.now() + tokens.expires_in * 1000;
      scheduleRefresh(expiryMs);
      try {
        const me = await getUserInfo(tokens.access_token);
        updateUser(me);
      } catch {
        // getUserInfo failed but tokens are stored; user will be fetched on next load
      }
    },
    [storeTokens, scheduleRefresh, updateUser]
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
      <AuthSetterContext.Provider value={{ setAuthTokens }}>{children}</AuthSetterContext.Provider>
    </AuthContext.Provider>
  );
}

// Separate context for the setter to avoid re-renders
const AuthSetterContext = createContext<{
  setAuthTokens: (tokens: TokenResponse) => Promise<void>;
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
