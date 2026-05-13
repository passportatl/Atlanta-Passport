import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetVisitor,
  getGetVisitorQueryKey,
  type Visitor,
} from "@workspace/api-client-react";

const STORAGE_KEY = "atlanta-passport-visitor-id";

interface VisitorContextValue {
  visitorId: string | null;
  visitor: Visitor | null;
  isLoading: boolean;
  setVisitorId: (id: string | null) => void;
  clear: () => void;
}

const VisitorContext = createContext<VisitorContextValue | null>(null);

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitorId, setVisitorIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });
  const queryClient = useQueryClient();

  const setVisitorId = useCallback((id: string | null) => {
    setVisitorIdState(id);
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clear = useCallback(() => setVisitorId(null), [setVisitorId]);

  const { data: visitor, isLoading, error } = useGetVisitor(visitorId ?? "", {
    query: {
      queryKey: getGetVisitorQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
      retry: false,
    },
  });

  useEffect(() => {
    if (visitorId && error) {
      // visitor was deleted — clear local
      window.localStorage.removeItem(STORAGE_KEY);
      setVisitorIdState(null);
      queryClient.removeQueries({ queryKey: getGetVisitorQueryKey(visitorId) });
    }
  }, [error, visitorId, queryClient]);

  const value = useMemo<VisitorContextValue>(
    () => ({
      visitorId,
      visitor: (visitor as Visitor | undefined) ?? null,
      isLoading: !!visitorId && isLoading,
      setVisitorId,
      clear,
    }),
    [visitorId, visitor, isLoading, setVisitorId, clear],
  );

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>;
}

export function useVisitor(): VisitorContextValue {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error("useVisitor must be used within VisitorProvider");
  return ctx;
}
