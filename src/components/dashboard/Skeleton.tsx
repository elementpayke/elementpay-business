import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";

export default function Skeleton({
  className,
  rounded = "md",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}) {
  const radius = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <span
      aria-hidden
      className={mergeClasses(
        "block animate-pulse bg-[linear-gradient(90deg,#EEF0F6_0%,#F6F7FB_50%,#EEF0F6_100%)] bg-[length:200%_100%]",
        radius,
        className,
      )}
    />
  );
}
