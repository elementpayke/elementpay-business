"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Loader2, SkipForward, CheckCircle2, AlertCircle } from "lucide-react";
import { connectWallet } from "@/lib/auth";

export default function ConnectWalletPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("evm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const chains = [
    { value: "evm", label: "EVM (Generic)" },
    { value: "scroll", label: "Scroll" },
    { value: "base", label: "Base" },
    { value: "lisk", label: "Lisk" },
    { value: "arbitrum", label: "Arbitrum" },
    { value: "starknet", label: "StarkNet" },
  ];

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address) || /^0x[a-fA-F0-9]{64}$/.test(address);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress) {
      setError("Please enter a valid wallet address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await connectWallet({ address, chain });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 mb-6">
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Connect your wallet
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            Link a wallet to your business account for seamless payments and settlements. You can always do this later.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-tertiary-100 dark:bg-tertiary-900/30 border border-tertiary-200 dark:border-tertiary-800 rounded-2xl p-8 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-tertiary-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet connected!</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Redirecting to your dashboard...</p>
          </motion.div>
        ) : (
          <>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleConnect} className="space-y-5">
              {/* Chain Select */}
              <div>
                <label htmlFor="chain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Blockchain network
                </label>
                <select
                  id="chain"
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
                >
                  {chains.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Wallet address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.trim())}
                  placeholder="0x..."
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    address.length > 2
                      ? isValidAddress
                        ? "border-tertiary-300 dark:border-tertiary-700 focus:ring-tertiary-500/20 focus:border-tertiary-500"
                        : "border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:ring-primary-500/20 focus:border-primary-500"
                  }`}
                />
                {address.length > 2 && !isValidAddress && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                    Enter a valid Ethereum (40-char) or StarkNet (64-char) address
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isValidAddress}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    Connect Wallet
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Skip Button */}
            <div className="mt-4">
              <button
                onClick={handleSkip}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium py-3 px-6 rounded-xl transition-all border border-gray-200 dark:border-gray-700"
              >
                <SkipForward className="w-4 h-4" />
                Skip for now
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
              You can connect or change your wallet anytime in Settings.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
