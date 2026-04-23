import { ChevronRight } from "lucide-react";
import Skeleton from "@/components/dashboard/Skeleton";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

function SkeletonButton() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EAF3] bg-white text-[#B1B6C7]">
      <Skeleton className="h-4 w-4" rounded="full" />
    </span>
  );
}

function SummarySkeletonBlock() {
  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-8 w-24" rounded="full" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-1.5 w-full" rounded="full" />
      </div>
      <Skeleton className="h-11 w-52" rounded="lg" />
      <Skeleton className="h-14 w-full" rounded="lg" />
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-24" rounded="full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#EEF0F6] bg-[#FAFBFE]">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center justify-between gap-4 border-t border-[#EEF1F7] px-4 py-3 first:border-t-0">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerificationPageSkeleton() {
  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <SkeletonButton />
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EAF3] bg-white text-[#B1B6C7]">
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-2 pt-0.5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-[#ECEEF5] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <SummarySkeletonBlock />
            <div className="border-t border-[#ECEEF5] md:border-l md:border-t-0">
              <SummarySkeletonBlock />
            </div>
            <div className="border-t border-[#ECEEF5] md:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0">
              <SummarySkeletonBlock />
            </div>
          </div>
        </div>

        <div className="border-b border-[#ECEEF5]">
          <div className="flex gap-7 overflow-x-auto py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
          <section className={cardClassName("p-6")}>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 space-y-6">
              <GroupSkeleton />
              <GroupSkeleton />
            </div>
          </section>

          <aside className={cardClassName("p-6")}>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="mt-2 h-4 w-48" />
            <div className="mt-5 space-y-4">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
