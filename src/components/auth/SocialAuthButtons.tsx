"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

type Provider = "google" | "apple";

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.365 1.43c0 1.14-.42 2.22-1.19 3.02-.78.83-2.06 1.47-3.1 1.38-.14-1.1.41-2.27 1.15-3.04.82-.87 2.23-1.5 3.14-1.36zM20.5 17.07c-.56 1.3-.83 1.88-1.56 3.03-1.01 1.61-2.44 3.61-4.21 3.62-1.57.01-1.97-1.02-4.1-1-2.13.01-2.57 1.02-4.14 1.01-1.77-.01-3.12-1.82-4.13-3.43C-.45 15.84-.75 10.46 2.11 7.7c1.01-.98 2.37-1.6 3.84-1.62 1.6-.03 3.1 1.08 4.1 1.08 1 0 2.83-1.33 4.77-1.14.81.03 3.09.33 4.55 2.47-3.99 2.18-3.36 8.03 1.13 9.58z"
      />
    </svg>
  );
}

function ProviderButton({
  provider,
  label,
  onClick,
  loading,
  disabled,
}: {
  provider: Provider;
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full h-12 items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <ProviderIcon provider={provider} />
      )}
      <span>{label}</span>
    </button>
  );
}

function PrivyButtons() {
  const { login } = usePrivy();
  const [pending, setPending] = useState<Provider | null>(null);

  const handle = async (provider: Provider) => {
    setPending(provider);
    try {
      await login({ loginMethods: [provider] });
    } catch {
      // User likely closed the modal — no UI feedback needed.
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      <ProviderButton
        provider="google"
        label="Continue with Google"
        onClick={() => handle("google")}
        loading={pending === "google"}
        disabled={false}
      />
      <ProviderButton
        provider="apple"
        label="Continue with Apple"
        onClick={() => handle("apple")}
        loading={pending === "apple"}
        disabled={false}
      />
    </div>
  );
}

function DisabledButtons() {
  return (
    <div className="grid grid-cols-1 gap-3">
      <ProviderButton
        provider="google"
        label="Continue with Google"
        onClick={() => {}}
        loading={false}
        disabled
      />
      <ProviderButton
        provider="apple"
        label="Continue with Apple"
        onClick={() => {}}
        loading={false}
        disabled
      />
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Social sign-in is not configured in this environment.
      </p>
    </div>
  );
}

export default function SocialAuthButtons() {
  const privyEnabled = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  return privyEnabled ? <PrivyButtons /> : <DisabledButtons />;
}
