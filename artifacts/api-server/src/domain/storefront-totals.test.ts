import { describe, expect, it } from "vitest";
import {
  calculateStorefrontTotals,
  canFulfillInventory,
  normalizeCurrency,
} from "./storefront-totals";

describe("storefront totals", () => {
  it("calculates integer minor-unit totals on the server", () => {
    expect(
      calculateStorefrontTotals({
        lines: [
          { variantId: "shirt-black-m", quantity: 2, unitPriceCents: 2_500 },
          { variantId: "pin", quantity: 1, unitPriceCents: 800 },
        ],
        discountCents: 500,
        shippingCents: 600,
        taxCents: 464,
      }),
    ).toEqual({
      subtotalCents: 5_800,
      discountCents: 500,
      shippingCents: 600,
      taxCents: 464,
      totalCents: 6_364,
    });
  });

  it("rejects duplicate variants and invalid money values", () => {
    expect(() =>
      calculateStorefrontTotals({
        lines: [
          { variantId: "pin", quantity: 1, unitPriceCents: 800 },
          { variantId: "pin", quantity: 1, unitPriceCents: 800 },
        ],
      }),
    ).toThrow("Duplicate variant");
    expect(() =>
      calculateStorefrontTotals({
        lines: [{ variantId: "pin", quantity: 1, unitPriceCents: 800.5 }],
      }),
    ).toThrow("non-negative integer");
    expect(() =>
      calculateStorefrontTotals({
        lines: [{ variantId: "pin", quantity: 1, unitPriceCents: 800 }],
        discountCents: 900,
      }),
    ).toThrow("Discount cannot exceed subtotal");
  });

  it("normalizes valid ISO currency codes", () => {
    expect(normalizeCurrency(" USD ")).toBe("usd");
    expect(() => normalizeCurrency("dollars")).toThrow("three-letter ISO code");
  });
});

describe("storefront inventory", () => {
  it("accounts for reservations before allowing fulfillment", () => {
    expect(
      canFulfillInventory({
        requestedQuantity: 3,
        availableQuantity: 5,
        reservedQuantity: 2,
        trackInventory: true,
        allowBackorder: false,
      }),
    ).toBe(true);
    expect(
      canFulfillInventory({
        requestedQuantity: 4,
        availableQuantity: 5,
        reservedQuantity: 2,
        trackInventory: true,
        allowBackorder: false,
      }),
    ).toBe(false);
  });

  it("allows untracked inventory and explicit backorders", () => {
    expect(
      canFulfillInventory({
        requestedQuantity: 5,
        availableQuantity: 0,
        reservedQuantity: 0,
        trackInventory: false,
        allowBackorder: false,
      }),
    ).toBe(true);
    expect(
      canFulfillInventory({
        requestedQuantity: 5,
        availableQuantity: 0,
        reservedQuantity: 0,
        trackInventory: true,
        allowBackorder: true,
      }),
    ).toBe(true);
  });
});
