"use client";

import { Shield, Lock, Eye, FileCheck } from "lucide-react";
import { FadeIn, StaggerChildren } from "./FadeIn";
import { motion } from "framer-motion";

const securityFeatures = [
  {
    icon: Shield,
    title: "SOC 2 Type II",
    description: "Independently audited security controls and processes.",
  },
  {
    icon: Lock,
    title: "256-bit Encryption",
    description: "Bank-grade encryption for all data in transit and at rest.",
  },
  {
    icon: Eye,
    title: "Multi-Sig Approvals",
    description: "Require multiple signers for high-value transactions.",
  },
  {
    icon: FileCheck,
    title: "Complete Audit Trail",
    description: "Every action logged, timestamped, and immutable.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Security() {
  return (
    <section id="security" className="py-24 lg:py-32 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-300 uppercase tracking-widest mb-3">
            Security
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Built for trust.
            <br />
            <span className="text-gray-500">Engineered for compliance.</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Enterprise-grade infrastructure that meets the strictest
            regulatory and security requirements.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
          {securityFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-base font-bold text-white">{feature.title}</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
