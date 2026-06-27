"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DevStatusBar from "@/components/dashboard/DevStatusBar";
import {
  getDrawerFocusWrapTarget,
  shouldCloseMobileDrawerForDesktopBreakpoint,
} from "@/components/dashboard/mobileDrawerFocus";
import { useAuth } from "@/lib/AuthContext";
import { devLog } from "@/lib/devlog";

const drawerFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated, kybVerified } = useAuth();
  const lastAuthRef = useRef<boolean | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);
  const sidebarOpenerRef = useRef<HTMLElement | null>(null);
  const shouldRestoreSidebarFocusRef = useRef(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The /auth/me business.kyb_verified flag is the sole source of truth for
  // dashboard access. kyb_status="submitted" is a review-pending state, not a
  // verified one — those users belong in onboarding (or a review-in-progress
  // screen) until the backend approves them.
  // kybVerified === null means /me hasn't resolved yet — wait, don't redirect.
  const needsOnboarding = kybVerified === false;

  useEffect(() => {
    if (loading) return;
    if (lastAuthRef.current === null) {
      devLog.info("auth", authenticated ? "Session restored" : "No active session");
    } else if (lastAuthRef.current !== authenticated) {
      devLog.info("auth", authenticated ? "Signed in" : "Signed out");
    }
    lastAuthRef.current = authenticated;

    console.log("[guard:dashboard]", {
      authenticated,
      loading,
      kybVerified,
      needsOnboarding,
    });

    if (!authenticated) {
      router.replace("/auth/login");
      return;
    }
    if (needsOnboarding) {
      console.warn("[guard:dashboard] redirecting → /onboarding");
      router.replace("/onboarding");
    }
  }, [authenticated, loading, needsOnboarding, router, kybVerified]);

  const gated = loading || !authenticated || needsOnboarding;

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeForDesktopBreakpoint = (matchesDesktop: boolean) => {
      if (!shouldCloseMobileDrawerForDesktopBreakpoint(sidebarOpen, matchesDesktop)) return;

      shouldRestoreSidebarFocusRef.current = false;
      sidebarOpenerRef.current = null;
      setSidebarOpen(false);
    };

    closeForDesktopBreakpoint(desktopMediaQuery.matches);

    const handleDesktopBreakpointChange = (event: MediaQueryListEvent) => {
      closeForDesktopBreakpoint(event.matches);
    };

    desktopMediaQuery.addEventListener("change", handleDesktopBreakpointChange);

    return () => {
      desktopMediaQuery.removeEventListener("change", handleDesktopBreakpointChange);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const drawer = mobileDrawerRef.current;
    const focusableElements = getDrawerFocusableElements(drawer);
    const initialFocusTarget = focusableElements[0] ?? drawer;

    initialFocusTarget?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) return;

    const opener = sidebarOpenerRef.current;
    if (shouldRestoreSidebarFocusRef.current && opener?.isConnected) {
      opener.focus();
    }
    shouldRestoreSidebarFocusRef.current = true;
    sidebarOpenerRef.current = null;
  }, [sidebarOpen]);

  function openSidebar() {
    const activeElement = document.activeElement;
    sidebarOpenerRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    shouldRestoreSidebarFocusRef.current = true;
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleMobileDrawerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeSidebar();
      return;
    }

    if (event.key !== "Tab") return;

    const drawer = mobileDrawerRef.current;
    const focusableElements = getDrawerFocusableElements(drawer);

    if (focusableElements.length === 0) {
      event.preventDefault();
      drawer?.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === drawer) {
      event.preventDefault();
      focusableElements[focusableElements.length - 1]?.focus();
      return;
    }

    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const wrapTarget = getDrawerFocusWrapTarget(focusableElements, activeElement, event.shiftKey);

    if (!wrapTarget) return;

    event.preventDefault();
    wrapTarget.focus();
  }

  if (gated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <DevStatusBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/35"
              onClick={closeSidebar}
            />
            <div
              ref={mobileDrawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              tabIndex={-1}
              onKeyDown={handleMobileDrawerKeyDown}
              className="absolute inset-y-0 left-0 w-[282px] max-w-[86vw] bg-surface shadow-xl outline-none"
            >
              <DashboardSidebar mobile onClose={closeSidebar} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="w-full border-b border-border bg-surface">
            <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
              <DashboardNavbar onOpenSidebar={openSidebar} />
            </div>
          </div>

          <main className="mx-auto min-w-0 max-w-[1480px] overflow-x-hidden px-5 pb-10 pt-6 md:px-7 lg:px-10">
            {children}
          </main>
        </div>
      </div>

      <DevStatusBar />
    </div>
  );
}

function getDrawerFocusableElements(drawer: HTMLDivElement | null): HTMLElement[] {
  if (!drawer) return [];

  return Array.from(drawer.querySelectorAll<HTMLElement>(drawerFocusableSelector)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}
