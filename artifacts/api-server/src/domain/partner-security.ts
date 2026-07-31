import { createHash } from "node:crypto";

export const PARTNER_ROLES = [
  "owner",
  "manager",
  "editor",
  "analyst",
  "billing",
] as const;

export type PartnerRole = (typeof PARTNER_ROLES)[number];

export function isPartnerRole(value: unknown): value is PartnerRole {
  return (
    typeof value === "string" && PARTNER_ROLES.includes(value as PartnerRole)
  );
}

export function normalizePartnerEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function hashPartnerInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function validatePartnerInvitation(
  invitation: {
    intendedEmail: string;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  } | null,
  signedInEmails: string[],
  now = new Date(),
): "valid" | "missing" | "accepted" | "revoked" | "expired" | "email_mismatch" {
  if (!invitation) return "missing";
  if (invitation.acceptedAt) return "accepted";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt <= now) return "expired";
  const intendedEmail = normalizePartnerEmail(invitation.intendedEmail);
  const normalizedEmails = signedInEmails.map(normalizePartnerEmail);
  return normalizedEmails.includes(intendedEmail) ? "valid" : "email_mismatch";
}
