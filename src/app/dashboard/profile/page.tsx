"use client";

import { useRouter } from "next/navigation";
import { Building2, BriefcaseBusiness, Globe2, LogOut, Phone, UserRound } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import PreferencesCard from "@/components/profile/PreferencesCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SecurityCard from "@/components/profile/SecurityCard";
import { useAuth } from "@/lib/AuthContext";

function InfoCard({ title, items }: { title: string; items: Array<{ label: string; value: string; icon: React.ReactNode }> }) {
  return (
    <div className={cardClassName("p-6")}>
      <h2 className="text-base font-semibold text-[#1D243C]">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#EEF0F6] px-4 py-4">
            <div className="flex items-center gap-2 text-[#8E93A7]">
              {item.icon}
              <span className="text-xs uppercase tracking-[0.14em]">{item.label}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#1D243C]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = user?.email
    ? user.email
        .split("@")[0]
        .split(/[._-]/)
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
    : "—";

  function handleLogout() {
    logout();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <ProfileHeader />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <InfoCard
            title="Personal information"
            items={[
              { label: "Full name", value: displayName, icon: <UserRound className="h-4 w-4" /> },
              { label: "Email", value: user?.email ?? "—", icon: <Globe2 className="h-4 w-4" /> },
              { label: "Phone", value: "+254 700 123 456", icon: <Phone className="h-4 w-4" /> },
              { label: "Country", value: "Kenya", icon: <Globe2 className="h-4 w-4" /> },
            ]}
          />

          <InfoCard
            title="Business information"
            items={[
              { label: "Company", value: "ElementPay Africa Ltd", icon: <Building2 className="h-4 w-4" /> },
              { label: "Role", value: "Treasury Operations Lead", icon: <BriefcaseBusiness className="h-4 w-4" /> },
              { label: "Industry", value: "Financial Services", icon: <Building2 className="h-4 w-4" /> },
              { label: "Settlement region", value: "East and West Africa", icon: <Globe2 className="h-4 w-4" /> },
            ]}
          />
        </div>

        <div className="space-y-6">
          <SecurityCard />
          <PreferencesCard />

          <div className={cardClassName("p-6")}>
            <h2 className="text-base font-semibold text-[#1D243C]">Danger zone</h2>
            <p className="mt-2 text-sm text-[#7E8498]">Log out from this device or begin account deactivation for your business workspace.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FFF1F1] px-4 text-sm font-semibold text-[#D95252] transition hover:brightness-95"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button className="h-11 rounded-xl border border-[#F0D2D2] px-4 text-sm font-semibold text-[#B84B4B] transition hover:bg-[#FFF8F8]">
                Deactivate account
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}