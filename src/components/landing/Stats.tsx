"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { FadeIn, StaggerChildren } from "./FadeIn";
import { motion } from "framer-motion";

const stats = [
  { value: 2, prefix: "$", suffix: "B+", label: "Transaction Volume" },
  { value: 150, suffix: "+", label: "Countries Supported" },
  { value: 99, suffix: ".99%", label: "Uptime SLA" },
  { value: 500, suffix: "+", label: "Business Customers" },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function Stats() {
  return (
    <section className="py-24 lg:py-32 bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <StaggerChildren
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          stagger={0.1}
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={cardVariants} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white">
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <p className="mt-2 text-sm text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
