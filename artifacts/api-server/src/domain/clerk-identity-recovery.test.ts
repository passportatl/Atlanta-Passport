import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  identityRecoveryEnabled,
  normalizeIdentityEmail,
  verifiedPrimaryEmail,
} from "./clerk-identity-recovery";

describe("Clerk identity recovery", () => {
  // identityRecoveryEnabled() falls back to process.env when called without an
  // argument, so ambient Development configuration (the flag may legitimately
  // be enabled there) must not leak into these assertions. Stash and restore
  // the env var so the test is hermetic either way.
  let savedFlag: string | undefined;

  beforeEach(() => {
    savedFlag = process.env.CLERK_IDENTITY_RECOVERY_ENABLED;
    delete process.env.CLERK_IDENTITY_RECOVERY_ENABLED;
  });

  afterEach(() => {
    if (savedFlag === undefined) {
      delete process.env.CLERK_IDENTITY_RECOVERY_ENABLED;
    } else {
      process.env.CLERK_IDENTITY_RECOVERY_ENABLED = savedFlag;
    }
  });

  it("is disabled unless explicitly enabled", () => {
    expect(identityRecoveryEnabled(undefined)).toBe(false);
    expect(identityRecoveryEnabled("false")).toBe(false);
    expect(identityRecoveryEnabled("true")).toBe(true);
  });

  it("reads the environment flag when no argument is given", () => {
    expect(identityRecoveryEnabled()).toBe(false);
    process.env.CLERK_IDENTITY_RECOVERY_ENABLED = "true";
    expect(identityRecoveryEnabled()).toBe(true);
  });

  it("normalizes a verified primary address", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddress: {
          emailAddress: " Visitor@Example.COM ",
          verification: { status: "verified" },
        },
      }),
    ).toBe("visitor@example.com");
  });

  it("rejects an unverified primary address", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddress: {
          emailAddress: "visitor@example.com",
          verification: { status: "unverified" },
        },
      }),
    ).toBeNull();
  });

  it("does not substitute a verified secondary address", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "primary",
        emailAddresses: [
          {
            id: "primary",
            emailAddress: "primary@example.com",
            verification: { status: "unverified" },
          },
          {
            id: "secondary",
            emailAddress: "secondary@example.com",
            verification: { status: "verified" },
          },
        ],
      }),
    ).toBeNull();
  });

  it("finds the verified primary address by id", () => {
    expect(
      verifiedPrimaryEmail({
        primaryEmailAddressId: "primary",
        emailAddresses: [
          {
            id: "primary",
            emailAddress: "Primary@Example.com",
            verification: { status: "verified" },
          },
        ],
      }),
    ).toBe("primary@example.com");
  });

  it("normalizes identity email consistently", () => {
    expect(normalizeIdentityEmail(" Partner@Example.COM ")).toBe(
      "partner@example.com",
    );
  });
});
