"use client";

import { BadgeCheck, Mail } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useAuth } from "@/lib/AuthContext";

function getDisplayName(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileHeader() {
  const { user } = useAuth();
  const displayName = user?.email ? getDisplayName(user.email) : "User";
  const initials = getInitials(displayName);

  return (
    <div className={cardClassName("overflow-hidden")}>
      <div className="bg-[radial-gradient(circle_at_top_left,#D8D7F4,transparent_40%),radial-gradient(circle_at_top_right,#FFCCD7,transparent_36%),linear-gradient(180deg,#FCFCFF_0%,#FFFFFF_100%)] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-18 w-18 items-center justify-center rounded-[28px] bg-primary-500 text-xl font-bold text-white shadow-[0_18px_32px_rgba(65,58,203,0.22)]">
              {initials}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                {user?.kyc_verified ? "Verified" : "Unverified"}
              </div>
              <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#171D32]">{displayName}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6C748C]">
                <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {user?.email ?? ""}</span>
              </div>
            </div>
          </div>

          <button className="h-11 rounded-xl border border-[#DFE3EF] bg-white px-4 text-sm font-semibold text-[#1D243C] transition hover:-translate-y-0.5 hover:border-[#CCD3E4]">
            Edit profile
          </button>
        </div>
      </div>
    </div>
  );
}