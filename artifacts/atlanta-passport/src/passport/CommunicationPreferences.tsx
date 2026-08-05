import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  customFetch,
  getGetVisitorQueryKey,
  type Visitor,
} from "@workspace/api-client-react";
import { useVisitor } from "./visitor-context";

interface Props {
  requireLegalConsent?: boolean;
  onSaved?: (visitor: Visitor) => void;
}

export function CommunicationPreferences({
  requireLegalConsent = false,
  onSaved,
}: Props) {
  const { visitorId, visitor } = useVisitor();
  const queryClient = useQueryClient();
  const [acceptTerms, setAcceptTerms] = useState(
    Boolean(visitor?.termsAcceptedAt),
  );
  const [acceptPrivacy, setAcceptPrivacy] = useState(
    Boolean(visitor?.privacyAcceptedAt),
  );
  const [marketingOptIn, setMarketingOptIn] = useState(
    visitor?.marketingOptIn ?? true,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAcceptTerms(Boolean(visitor?.termsAcceptedAt));
    setAcceptPrivacy(Boolean(visitor?.privacyAcceptedAt));
    setMarketingOptIn(visitor?.marketingOptIn ?? true);
  }, [visitor]);

  const save = async () => {
    if (!visitorId) return;
    if (requireLegalConsent && (!acceptTerms || !acceptPrivacy)) {
      setError(
        "Please accept the Terms of Service and acknowledge the Privacy Policy.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await customFetch<Visitor>(
        `/api/visitors/${visitorId}/preferences`,
        {
          method: "PATCH",
          responseType: "json",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            acceptTerms,
            acceptPrivacy,
            marketingOptIn,
          }),
        },
      );
      queryClient.setQueryData(getGetVisitorQueryKey(visitorId), updated);
      setMessage("Your preferences are saved.");
      onSaved?.(updated);
    } catch {
      setError("We couldn't save your preferences. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {requireLegalConsent && (
        <>
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
            <input
              type="checkbox"
              checked={acceptTerms}
              disabled={Boolean(visitor?.termsAcceptedAt)}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
            />
            <span>
              I accept the{" "}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline"
              >
                Terms of Service
              </a>
              .
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              disabled={Boolean(visitor?.privacyAcceptedAt)}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
            />
            <span>
              I acknowledge the{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </>
      )}
      <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
        />
        <span>
          Send me Passport ATL newsletters, rewards, and promotions. This is
          optional and can be changed anytime.
        </span>
      </label>
      {error && (
        <p className="text-sm font-bold text-[hsl(var(--brand-red))]">
          {error}
        </p>
      )}
      {message && !error && (
        <p className="text-sm font-bold text-green-700">{message}</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={busy || !visitorId}
        className="button-pop button-pop-yellow disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}
