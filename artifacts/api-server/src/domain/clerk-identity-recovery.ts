type ClerkEmailAddressLike = {
  id?: string | null;
  emailAddress: string;
  verification?: { status?: string | null } | null;
};

type ClerkUserLike = {
  primaryEmailAddress?: ClerkEmailAddressLike | null;
  primaryEmailAddressId?: string | null;
  emailAddresses?: ClerkEmailAddressLike[];
};

export function normalizeIdentityEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function identityRecoveryEnabled(
  value = process.env.CLERK_IDENTITY_RECOVERY_ENABLED,
): boolean {
  return value === "true";
}

/**
 * Returns only a verified primary address. Account recovery must never rely on
 * an unverified or merely-added address because it can transfer ownership of
 * an existing Passport ATL record.
 */
export function verifiedPrimaryEmail(user: ClerkUserLike): string | null {
  const primary =
    user.primaryEmailAddress ??
    user.emailAddresses?.find(
      (address) => address.id === user.primaryEmailAddressId,
    ) ??
    null;

  if (primary?.verification?.status !== "verified") return null;
  const normalized = normalizeIdentityEmail(primary.emailAddress);
  return normalized || null;
}
