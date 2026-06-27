import { describe, expect, it } from "vitest";
import { getDrawerFocusWrapTarget } from "@/components/dashboard/mobileDrawerFocus";

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
