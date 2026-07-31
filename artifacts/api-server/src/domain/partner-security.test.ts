import { describe, expect, it } from "vitest";
import {
  hashPartnerInvitationToken,
  isPartnerRole,
  normalizePartnerEmail,
  validatePartnerInvitation,
} from "./partner-security";

const future = new Date("2026-08-07T12:00:00.000Z");
const now = new Date("2026-07-31T12:00:00.000Z");

describe("partner invitation security", () => {
  it("accepts only approved roles", () => {
    expect(isPartnerRole("owner")).toBe(true);
    expect(isPartnerRole("billing")).toBe(true);
    expect(isPartnerRole("admin")).toBe(false);
  });

  it("normalizes email addresses", () => {
    expect(normalizePartnerEmail(" Partner@Example.COM ")).toBe(
      "partner@example.com",
    );
  });

  it("hashes tokens without retaining plaintext", () => {
    const token = "single-use-invitation-token";
    const hash = hashPartnerInvitationToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashPartnerInvitationToken(token)).toBe(hash);
  });

  it("accepts an active invitation only for a matching email", () => {
    expect(
      validatePartnerInvitation(
        {
          intendedEmail: "owner@example.com",
          acceptedAt: null,
          revokedAt: null,
          expiresAt: future,
        },
        ["Owner@Example.com"],
        now,
      ),
    ).toBe("valid");
  });

  it.each([
    ["accepted", new Date(), null, future],
    ["revoked", null, new Date(), future],
    ["expired", null, null, new Date("2026-07-30T12:00:00.000Z")],
  ] as const)(
    "rejects an %s invitation",
    (expected, acceptedAt, revokedAt, expiresAt) => {
      expect(
        validatePartnerInvitation(
          {
            intendedEmail: "owner@example.com",
            acceptedAt,
            revokedAt,
            expiresAt,
          },
          ["owner@example.com"],
          now,
        ),
      ).toBe(expected);
    },
  );

  it("rejects a different signed-in email", () => {
    expect(
      validatePartnerInvitation(
        {
          intendedEmail: "owner@example.com",
          acceptedAt: null,
          revokedAt: null,
          expiresAt: future,
        },
        ["someone-else@example.com"],
        now,
      ),
    ).toBe("email_mismatch");
  });
});
