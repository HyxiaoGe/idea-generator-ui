"use client";

import { SWRConfig, type Cache } from "swr";
import { ReactNode, useCallback, useRef } from "react";
import { ApiError } from "./api-client";

const CACHE_KEY = "swr-cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function localStorageProvider(): Cache<any> {
  // Hydrate from localStorage on init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: Map<string, any>;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map = new Map<string, any>(stored ? JSON.parse(stored) : []);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map = new Map<string, any>();
  }

  // Persist to localStorage before unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(map.entries())));
      } catch {
        // Storage full or unavailable — ignore
      }
    });
  }

  return map as Cache;
}

function swrFetcher(path: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888/api"}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(typeof window !== "undefined" && sessionStorage.getItem("access_token")
        ? { Authorization: `Bearer ${sessionStorage.getItem("access_token")}` }
        : {}),
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = new ApiError(res.status, `HTTP ${res.status}`);
      throw error;
    }
    return res.json();
  });
}

export function SWRProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerRef = useRef<Cache<any> | null>(null);
  const getProvider = useCallback(() => {
    if (!providerRef.current) {
      providerRef.current = localStorageProvider();
    }
    return providerRef.current;
  }, []);

  return (
    <SWRConfig
      value={{
        provider: getProvider,
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: (err) => {
          if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
            return false;
          }
          return true;
        },
        errorRetryCount: 3,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
