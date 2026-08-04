import { useLocation } from "wouter";
import type { Visitor } from "@workspace/api-client-react";
import { CommunicationPreferences } from "@/passport/CommunicationPreferences";
import { PENDING_STAMP_KEY } from "@/passport/visitor-context";
import { MEMBER_HOME_ROUTE } from "@/auth/route-access";

export default function PassportConsent() {
  const [, setLocation] = useLocation();

  const continueToPassport = (_visitor: Visitor) => {
    const pending =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(PENDING_STAMP_KEY);
    setLocation(pending ? `/stamp/${pending}` : MEMBER_HOME_ROUTE, {
      replace: true,
    });
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="card-pop space-y-5 bg-white p-6 sm:p-8">
        <div>
          <div className="mb-3 inline-block border-2 border-foreground bg-[hsl(var(--brand-yellow))] px-3 py-1 text-xs font-black tracking-widest">
            ONE LAST STEP
          </div>
          <h1 className="text-3xl font-black">Finish your Passport</h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            Review the required agreements and choose whether you want Passport
            ATL news and promotions. Your marketing choice is always optional.
          </p>
        </div>
        <CommunicationPreferences
          requireLegalConsent
          onSaved={continueToPassport}
        />
      </div>
    </div>
  );
}
