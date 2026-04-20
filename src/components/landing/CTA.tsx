"use client";

import { ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 lg:py-32 bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to modernize your
            <br className="hidden sm:inline" /> business payments?
          </h2>
          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto">
            Join hundreds of companies already using ElementPay to move money
            faster, cheaper, and more securely.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 text-base"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-gray-700 hover:border-gray-600 text-gray-300 font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Talk to Sales
            </a>
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Free for startups · No setup fees · Cancel anytime
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
