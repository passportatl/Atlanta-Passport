import { createContext, useContext } from "react";
import type { Visitor } from "@workspace/api-client-react";

export const STORAGE_KEY = "atlanta-passport-visitor-id";

export interface VisitorContextValue {
  visitorId: string | null;
  visitor: Visitor | null;
  isLoading: boolean;
  setVisitorId: (id: string | null) => void;
  clear: () => void;
}

export const VisitorContext = createContext<VisitorContextValue | null>(null);

export function useVisitor(): VisitorContextValue {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error("useVisitor must be used within VisitorProvider");
  return ctx;
}
