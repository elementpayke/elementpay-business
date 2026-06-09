"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/AuthContext";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { OnboardingProvider } from "@/lib/onboarding/OnboardingContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <AuthProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </AuthProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
