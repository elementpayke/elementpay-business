"use client";

import { Bell, ChevronDown, Settings } from "lucide-react";
import CurrencySwitcher from "@/components/dashboard/CurrencySwitcher";
import { SearchInput, UserAvatar } from "@/components/dashboard/DashboardPrimitives";
import UserMenu from "@/components/navbar/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";

function getDisplayName(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function GhostIconButton({
  children,
  ariaLabel,
  className = "",
}: {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-[#7D8398] transition hover:bg-[#F4F5F9] hover:text-[#1F2640] dark:hover:bg-[#1e2235] dark:hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

export default function DashboardNavbar() {
  const { user } = useAuth();
  const displayName = user?.email ? getDisplayName(user.email) : "John Doe";
  const firstName = displayName.split(" ")[0];

  return (
    <header className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-500">
          <span className="block h-2.5 w-2.5 rounded-sm bg-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#1C2238] dark:text-white">
          ElementPay
        </span>
      </div>

      {/* Greeting */}
      <div className="hidden min-w-0 items-center justify-center gap-2 text-sm sm:flex">
        <span className="text-[#7E8498]">Hello,</span>
        <span className="font-semibold text-[#161D35] dark:text-white">{firstName}.</span>
        <span aria-hidden>👋</span>
        <span className="text-[#7E8498]">Welcome back!</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <CurrencySwitcher />
        <SearchInput />
        <ThemeToggle />
        <GhostIconButton ariaLabel="Notifications">
          <Bell className="h-[18px] w-[18px]" />
        </GhostIconButton>

        {/* Settings — hidden on mobile */}
        <GhostIconButton ariaLabel="Settings" className="hidden sm:flex">
          <Settings className="h-[18px] w-[18px]" />
        </GhostIconButton>

        {/* User menu */}
        <UserMenu email={user?.email}>
          <span className="ml-1 flex items-center gap-2 rounded-full px-1 py-1 transition hover:bg-[#F4F5F9] dark:hover:bg-[#1e2235]">
            <UserAvatar name={displayName} />
            <span className="hidden text-sm font-medium text-[#1F2640] dark:text-white sm:inline">
              {displayName}
            </span>
            {/* Chevron hidden on mobile */}
            <ChevronDown className="mr-1 hidden h-4 w-4 text-[#969CB0] sm:block" />
          </span>
        </UserMenu>
      </div>
    </header>
  );
}
