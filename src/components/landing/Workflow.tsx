"use client";

import { motion } from "framer-motion";
import {
  Building2,
  ArrowRight,
  Wallet,
  Send,
  CheckCircle2,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

const steps = [
  {
    step: "01",
    icon: Building2,
    title: "Connect Your Business",
    description:
      "Link your existing bank accounts and set up your ElementPay treasury in minutes. No lengthy onboarding.",
    color: "bg-primary-500",
  },
  {
    step: "02",
    icon: Wallet,
    title: "Fund & Manage",
    description:
      "Deposit funds, set budgets, and configure approval workflows. Hold balances in any currency.",
    color: "bg-primary-600",
  },
  {
    step: "03",
    icon: Send,
    title: "Send & Settle",
    description:
      "Execute payroll, vendor payments, and cross-border settlements. Real-time tracking and notifications.",
    color: "bg-primary-700",
  },
  {
    step: "04",
    icon: CheckCircle2,
    title: "Reconcile & Report",
    description:
      "Automatic reconciliation, audit trails, and exportable reports. Always audit-ready.",
    color: "bg-primary-800",
  },
];

const lineVariants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

export default function Workflow() {
  return (
    <section id="workflow" className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn className="text-center mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            From setup to settlement
            <br className="hidden sm:inline" /> in four simple steps
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Get your team onboarded and moving money in under 10 minutes.
          </p>
        </FadeIn>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ staggerChildren: 0.2 }}
            className="relative"
          >
            {/* Vertical connector line */}
            <motion.div
              variants={lineVariants}
              className="absolute left-[27px] top-12 bottom-12 w-px bg-gradient-to-b from-primary-300 via-primary-400 to-primary-700 origin-top hidden sm:block"
            />

            <div className="space-y-8 lg:space-y-12">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    variants={stepVariants}
                    className="relative flex gap-6 items-start group"
                  >
                    {/* Step indicator */}
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-primary-500/20`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-md">
                        {step.description}
                      </p>
                      {idx < steps.length - 1 && (
                        <div className="mt-4">
                          <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
