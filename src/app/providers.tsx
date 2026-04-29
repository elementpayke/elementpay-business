"use client";

import { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/AuthContext";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { OnboardingProvider } from "@/lib/onboarding/OnboardingContext";
import { wagmiConfig } from "@/lib/wallets/wagmi-config";
import PrivyAuthSync from "@/components/auth/PrivyAuthSync";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  const tree = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CurrencyProvider>
        <AuthProvider>
          {appId ? <PrivyAuthSync /> : null}
          <OnboardingProvider>{children}</OnboardingProvider>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );

  if (!appId) {
    return tree;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet", "google", "apple"],
        appearance: {
          theme: "light",
          accentColor: "#413ACB",
          logo: "/elementpay.png",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{tree}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
