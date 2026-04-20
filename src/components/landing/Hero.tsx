"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardMockup from "./DashboardMockup";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-200/30 rounded-full blur-[128px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary-200/20 rounded-full blur-[96px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary-100/60 border border-primary-200/50 text-primary-600 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                Now in Private Beta
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.08] tracking-tight"
            >
              Move Business Money
              <br />
              <span className="text-primary-500">at Internet Speed</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md"
            >
              The financial operating system for modern businesses. Payroll,
              treasury, vendor payments, and global settlements — all
              in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25"
              >
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See How It Works
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-4 text-xs text-gray-400"
            >
              No credit card required · SOC 2 compliant · 256-bit encryption
            </motion.p>
          </div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative lg:ml-8"
          >
            {/* Floating accent cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute -top-4 -left-4 z-10 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-tertiary-100 flex items-center justify-center">
                  <span className="text-tertiary-600 text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Payment Sent</p>
                  <p className="text-[10px] text-gray-400">$12,450 → Vendor </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -bottom-4 -right-4 z-10 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 text-xs font-bold">↗</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Settlement Complete</p>
                  <p className="text-[10px] text-gray-400">EUR → USD in 0.8s</p>
                </div>
              </div>
            </motion.div>

            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
