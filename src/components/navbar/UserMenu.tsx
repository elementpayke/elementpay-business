"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, Shield, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@/lib/AuthContext";

type UserMenuProps = {
  children: React.ReactNode;
  email?: string | null;
};

function getDisplayName(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const menuItems = [
  { href: "/dashboard/profile", label: "View Profile", icon: User },
  { href: "/dashboard/settings", label: "Account Settings", icon: Settings },
  { href: "/dashboard/security", label: "Security", icon: Shield },
];

export default function UserMenu({ children, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const { linkWallet } = usePrivy();
  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleConnectWallet() {
    setOpen(false);
    linkWallet();
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleLogout() {
    logout();
    setOpen(false);
    router.replace("/auth/login");
    router.refresh();
  }

  const displayName = email ? getDisplayName(email) : "User";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+12px)] z-40 w-[220px] rounded-2xl border border-[#E9EAF2] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            role="menu"
          >
            <div className="border-b border-[#F0F2F7] px-3 py-3">
              <p className="text-sm font-semibold text-[#1B223B]">{displayName}</p>
              <p className="mt-1 text-xs text-[#8D92A6]">{email ?? ""}</p>
            </div>

            <div className="py-2">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#5F667D] transition hover:bg-[#F6F7FB] hover:text-[#222945]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={handleConnectWallet}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#5F667D] transition hover:bg-[#F6F7FB] hover:text-[#222945]"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            </div>

            <div className="border-t border-[#F0F2F7] pt-2">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#D95252] transition hover:bg-[#FFF5F5]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
