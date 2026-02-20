"use client";

import { SWRConfig, type Cache } from "swr";
import { ReactNode, useCallback, useRef } from "react";
import { ApiError, getApiClient } from "./api-client";

const CACHE_KEY = "swr-cache";

// Keys matching these patterns should NOT be persisted to localStorage
// because they contain paginated data that interferes with useSWRInfinite
function shouldPersistKey(key: string): boolean {
  if (key.startsWith("$inf$")) return false;
  // Paginated template lists - always fetch fresh to avoid stale infinite-scroll state
  if (key.startsWith("/templates?") && key.includes("page")) return false;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function localStorageProvider(): Cache<any> {
  // Hydrate from localStorage on init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: Map<string, any>;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    const raw: [string, unknown][] = stored ? JSON.parse(stored) : [];
    // Strip paginated & infinite-scroll keys to avoid stale state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map = new Map<string, any>(raw.filter(([key]) => shouldPersistKey(key)));
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map = new Map<string, any>();
  }

  // Persist to localStorage before unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      try {
        const entries = Array.from(map.entries()).filter(([key]) => shouldPersistKey(key));
        localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
      } catch {
        // Storage full or unavailable — ignore
      }
    });
  }

  return map as Cache;
}

async function swrFetcher(path: string) {
  return getApiClient().get(path);
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
