import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import type { VerificationLimitProfile } from "@/lib/verification/types";

export default function VerificationLimitsCard({
  profile,
}: {
  profile: VerificationLimitProfile;
}) {
  return (
    <aside
      className={cardClassName(
        "self-start p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(17,24,39,0.04)] xl:sticky xl:top-6",
      )}
    >
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1D243C]">
        Current transaction limits
      </h2>
      <p className="mt-2 text-sm font-medium text-tertiary-600">{profile.title}</p>

      <div className="mt-5 divide-y divide-[#EEF1F7]">
        {profile.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
            <span className="text-sm text-[#7E8498]">{metric.label}</span>
            <span className={`text-right text-sm font-medium ${metric.muted ? "text-[#8F95A8]" : "text-[#1D243C]"}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
