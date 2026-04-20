"use client";

import { FadeIn } from "./FadeIn";

const logos = [
  { name: "TechCorp", width: "w-24" },
  { name: "FinanceHub", width: "w-28" },
  { name: "GlobalPay", width: "w-24" },
  { name: "NexusBank", width: "w-26" },
  { name: "VeloCity", width: "w-24" },
  { name: "Meridian", width: "w-28" },
];

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-300 hover:text-gray-400 transition-colors">
      <div className="w-6 h-6 rounded-md bg-gray-200/60 flex items-center justify-center">
        <span className="text-[9px] font-bold text-gray-400">{name[0]}</span>
      </div>
      <span className="text-sm font-semibold tracking-wide">{name}</span>
    </div>
  );
}

export default function TrustStrip() {
  return (
    <section className="py-16 border-y border-gray-100 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">
            Trusted by forward-thinking finance teams
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="flex items-center justify-center gap-12 lg:gap-16 flex-wrap">
            {logos.map((logo) => (
              <LogoPlaceholder key={logo.name} name={logo.name} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
