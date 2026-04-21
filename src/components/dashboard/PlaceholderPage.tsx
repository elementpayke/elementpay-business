import { ArrowRight } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">{title}</h1>
      </div>

      <div className={cardClassName("flex min-h-[280px] flex-col justify-between p-8") }>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-500">Coming next</p>
          <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.04em] text-[#171D32]">{title} workspace</h2>
          <p className="mt-3 max-w-[520px] text-sm leading-6 text-[#7E8498]">{description}</p>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
          Planned in a later pass
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}