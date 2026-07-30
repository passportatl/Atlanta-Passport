import { describe, expect, it } from "vitest";
import {
  isGuestAccessibleRoute,
  isProtectedRoute,
  MEMBER_HOME_ROUTE,
} from "./route-access";

describe("guest route access", () => {
  it.each([
    "/",
    "/partners",
    "/apply",
    "/list-event",
    "/list-a-location",
    "/passport/contact",
    "/privacy-policy",
    "/terms-of-service",
    "/sign-in",
    "/sign-in/sso-callback",
    "/sign-up",
    "/sign-up/verify-email-address",
    "/stamp/trap-music-museum",
  ])("allows the approved guest route %s", (route) => {
    expect(isGuestAccessibleRoute(route)).toBe(true);
    expect(isProtectedRoute(route)).toBe(false);
  });

  it.each([
    "/passport",
    "/passport/stamps",
    "/passport/explore",
    "/passport/events",
    "/passport/legends",
    "/passport/shop",
    "/passport/routes",
    "/redeem/5",
    "/events/example",
    "/routes/example",
    "/listing/example",
    "/admin",
    "/admin/applications",
    "/admin/content",
  ])("protects member and operational route %s", (route) => {
    expect(isGuestAccessibleRoute(route)).toBe(false);
    expect(isProtectedRoute(route)).toBe(true);
  });

  it("does not allow paths that only resemble an authentication route", () => {
    expect(isGuestAccessibleRoute("/sign-intruder")).toBe(false);
    expect(isGuestAccessibleRoute("/sign-upper")).toBe(false);
    expect(isGuestAccessibleRoute("/stamp")).toBe(false);
  });

  it("normalizes query strings, hashes, and trailing slashes", () => {
    expect(isGuestAccessibleRoute("/partners/?source=home#form")).toBe(true);
    expect(isProtectedRoute("/passport/stamps/?month=july")).toBe(true);
  });
});

describe("member entry", () => {
  it("uses Stamps as the canonical authenticated landing route", () => {
    expect(MEMBER_HOME_ROUTE).toBe("/passport/stamps");
  });
});
