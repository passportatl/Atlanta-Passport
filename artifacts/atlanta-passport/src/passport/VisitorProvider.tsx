import {
  useCallback,
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
import {
  STORAGE_KEY,
  VisitorContext,
  type VisitorContextValue,
} from "./visitor-context";

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
