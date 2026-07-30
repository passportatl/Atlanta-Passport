import { describe, expect, it } from "vitest";
import type { Visitor } from "@workspace/api-client-react";
import { hasCurrentLegalConsent } from "./visitor-context";

function visitor(overrides: Partial<Visitor> = {}): Visitor {
  return {
    id: "visitor-1",
    firstName: "Alex",
    email: "alex@example.com",
    marketingOptIn: true,
    createdAt: "2026-07-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("hasCurrentLegalConsent", () => {
  it("requires both Terms and Privacy acceptance", () => {
    expect(
      hasCurrentLegalConsent(
        visitor({
          termsAcceptedAt: "2026-07-30T12:00:00.000Z",
          privacyAcceptedAt: "2026-07-30T12:00:00.000Z",
        }),
      ),
    ).toBe(true);
    expect(
      hasCurrentLegalConsent(
        visitor({ termsAcceptedAt: "2026-07-30T12:00:00.000Z" }),
      ),
    ).toBe(false);
    expect(
      hasCurrentLegalConsent(
        visitor({ privacyAcceptedAt: "2026-07-30T12:00:00.000Z" }),
      ),
    ).toBe(false);
    expect(hasCurrentLegalConsent(null)).toBe(false);
  });
});
