export type StorefrontLineInput = {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
};

export type StorefrontTotalsInput = {
  lines: StorefrontLineInput[];
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
};

export type StorefrontTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

function requireNonNegativeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

export function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new Error("Currency must be a three-letter ISO code");
  }
  return normalized;
}

export function calculateStorefrontTotals(
  input: StorefrontTotalsInput,
): StorefrontTotals {
  const variantIds = new Set<string>();
  let subtotalCents = 0;

  for (const line of input.lines) {
    if (!line.variantId.trim()) throw new Error("Variant ID is required");
    if (variantIds.has(line.variantId)) {
      throw new Error(`Duplicate variant ${line.variantId}`);
    }
    variantIds.add(line.variantId);
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }
    requireNonNegativeInteger(line.unitPriceCents, "Unit price");
    const lineTotal = line.quantity * line.unitPriceCents;
    if (!Number.isSafeInteger(lineTotal)) {
      throw new Error("Line total exceeds the safe integer range");
    }
    subtotalCents += lineTotal;
  }

  const discountCents = input.discountCents ?? 0;
  const shippingCents = input.shippingCents ?? 0;
  const taxCents = input.taxCents ?? 0;
  requireNonNegativeInteger(subtotalCents, "Subtotal");
  requireNonNegativeInteger(discountCents, "Discount");
  requireNonNegativeInteger(shippingCents, "Shipping");
  requireNonNegativeInteger(taxCents, "Tax");
  if (discountCents > subtotalCents) {
    throw new Error("Discount cannot exceed subtotal");
  }

  const totalCents = subtotalCents - discountCents + shippingCents + taxCents;
  requireNonNegativeInteger(totalCents, "Total");

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
  };
}

export function canFulfillInventory(input: {
  requestedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}): boolean {
  if (
    !Number.isSafeInteger(input.requestedQuantity) ||
    input.requestedQuantity <= 0
  )
    return false;
  if (!input.trackInventory || input.allowBackorder) return true;
  return (
    input.availableQuantity - input.reservedQuantity >= input.requestedQuantity
  );
}
