import { createContext, useContext } from "react";
import type { Visitor } from "@workspace/api-client-react";

export const STORAGE_KEY = "atlanta-passport-visitor-id";
export const PENDING_STAMP_KEY = "atlanta-passport-pending-stamp";

export interface VisitorContextValue {
  visitorId: string | null;
  visitor: Visitor | null;
  isLoading: boolean;
  // True only after ClerkVisitorBridge has confirmed the active visitorId is
  // linked to the currently signed-in Clerk user. Consumers that must collect
  // into the *account* (e.g. the QR-scan stamp flow) gate on this rather than
  // trusting a possibly-stale localStorage visitorId.
  linkedReady: boolean;
  setVisitorId: (id: string | null) => void;
  setLinkedReady: (ready: boolean) => void;
  clear: () => void;
}

export const VisitorContext = createContext<VisitorContextValue | null>(null);

export function useVisitor(): VisitorContextValue {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error("useVisitor must be used within VisitorProvider");
  return ctx;
}

export function hasCurrentLegalConsent(visitor: Visitor | null): boolean {
  return Boolean(visitor?.termsAcceptedAt && visitor?.privacyAcceptedAt);
}
