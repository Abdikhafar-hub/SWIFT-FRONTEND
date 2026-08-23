"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Do not retry 401, 403, 404
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status === 401 || status === 403 || status === 404) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={4500}
          toastOptions={{
            style: {
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            },
            className: "swift-doc-toast",
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

