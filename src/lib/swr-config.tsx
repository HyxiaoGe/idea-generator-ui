"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";
import { getApiClient, ApiError } from "./api-client";

function swrFetcher(path: string) {
  const client = getApiClient();
  // Use the client's internal request method via a simple GET wrapper
  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}${path}`, {
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
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: (err) => {
          // Don't retry on 401/403/404
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
