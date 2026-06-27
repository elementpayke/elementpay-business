import { describe, expect, it } from "vitest";
import {
  getDrawerFocusWrapTarget,
  shouldCloseMobileDrawerForDesktopBreakpoint,
} from "@/components/dashboard/mobileDrawerFocus";

describe("mobile drawer focus wrapping", () => {
  it("wraps Tab from the last focusable item to the first", () => {
    const focusables = ["brand", "close", "overview"];

    expect(getDrawerFocusWrapTarget(focusables, "overview", false)).toBe("brand");
  });

  it("wraps Shift+Tab from the first focusable item to the last", () => {
    const focusables = ["brand", "close", "overview"];

    expect(getDrawerFocusWrapTarget(focusables, "brand", true)).toBe("overview");
  });
});

describe("mobile drawer desktop breakpoint", () => {
  it("closes an open mobile drawer when the desktop breakpoint matches", () => {
    expect(shouldCloseMobileDrawerForDesktopBreakpoint(true, true)).toBe(true);
  });
});
