"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  Globe,
  Zap,
  BarChart3,
  Shield,
  Users,
} from "lucide-react";
import { FadeIn, StaggerChildren } from "./FadeIn";

const features = [
  {
    icon: Zap,
    title: "Instant Payouts",
    description:
      "Send payments to contractors and vendors in seconds, not days. Settle globally with near-zero fees.",
    color: "bg-primary-100 text-primary-600",
    span: "lg:col-span-2",
    visual: (
      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {["bg-primary-400", "bg-tertiary-400", "bg-secondary-400", "bg-primary-300"].map((c, i) => (
            <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white`} />
          ))}
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-gray-700 font-semibold">4 recipients</span> paid instantly
        </div>
      </div>
    ),
  },
  {
    icon: Globe,
    title: "Global Settlement",
    description:
      "Move money across borders and currencies. Automatic FX conversion with institutional rates.",
    color: "bg-tertiary-100 text-tertiary-600",
    span: "lg:col-span-1",
    visual: (
      <div className="mt-5 space-y-2">
        {[
          { from: "USD", to: "EUR", rate: "0.92" },
          { from: "USD", to: "GBP", rate: "0.79" },
        ].map((pair) => (
          <div key={pair.to} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-gray-600">
              {pair.from} → {pair.to}
            </span>
            <span className="text-xs font-bold text-gray-800">{pair.rate}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Wallet,
    title: "Multi-Currency Treasury",
    description:
      "Hold, manage, and earn yield on balances across multiple currencies and digital assets.",
    color: "bg-primary-100 text-primary-600",
    span: "lg:col-span-1",
    visual: (
      <div className="mt-5">
        <div className="flex items-end gap-1 h-12">
          {[35, 50, 40, 65, 55, 80, 70, 90, 85].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary-200 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Live dashboards for cash flow, burn rate, and runway. Export-ready reports for stakeholders.",
    color: "bg-tertiary-100 text-tertiary-600",
    span: "lg:col-span-1",
    visual: null,
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 Type II, multi-sig approvals, role-based access, and complete audit trails.",
    color: "bg-gray-100 text-gray-600",
    span: "lg:col-span-1",
    visual: null,
  },
  {
    icon: Users,
    title: "Team Controls",
    description:
      "Granular permissions, spending limits, and approval workflows for your entire organization.",
    color: "bg-primary-100 text-primary-600",
    span: "lg:col-span-2",
    visual: (
      <div className="mt-5 flex items-center gap-4">
        {["Admin", "Finance", "Viewer"].map((role) => (
          <div key={role} className="bg-white/60 rounded-lg px-3 py-1.5">
            <span className="text-xs font-medium text-gray-600">{role}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Everything your finance
            <br className="hidden sm:inline" /> team needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            One platform to replace your patchwork of banking portals, payment
            processors, and spreadsheets.
          </p>
        </FadeIn>

        <StaggerChildren
          className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          stagger={0.08}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className={`${feature.span} group relative bg-gray-50 hover:bg-gray-100/80 rounded-2xl p-6 lg:p-7 transition-colors border border-gray-100`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-4">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {feature.description}
                </p>
                {feature.visual}
              </motion.div>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
