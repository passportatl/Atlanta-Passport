import { describe, expect, it } from "vitest";
import {
  isGuestAccessibleRoute,
  isPartnerRoute,
  isProtectedRoute,
  MEMBER_HOME_ROUTE,
} from "./route-access";

describe("guest route access", () => {
  it.each([
    "/",
    "/partners",
    "/partners/sso-callback",
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

describe("partner context", () => {
  it.each([
    "/partners",
    "/partners/",
    "/partners/sso-callback",
    "/partners?invitation=token",
  ])("recognizes the partner route %s", (route) => {
    expect(isPartnerRoute(route)).toBe(true);
  });

  it.each(["/", "/passport", "/sign-in", "/list-a-location"])(
    "does not treat %s as a partner route",
    (route) => {
      expect(isPartnerRoute(route)).toBe(false);
    },
  );
});

describe("member entry", () => {
  it("uses Stamps as the canonical authenticated landing route", () => {
    expect(MEMBER_HOME_ROUTE).toBe("/passport/stamps");
  });
});
