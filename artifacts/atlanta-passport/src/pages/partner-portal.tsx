import { useEffect, useState } from "react";
import { SignIn, useClerk, useUser } from "@clerk/react";
import { Building2, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { basePath } from "@/auth/clerk";
import logoSrc from "@/assets/images/passport-atl-logo.png";

type PartnerSession = {
  account: {
    id: string;
    primaryEmail: string;
    displayName: string;
    status: string;
  };
  memberships: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
  }>;
};

function PartnerFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-paper text-foreground">
      <header className="border-b-2 border-foreground bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <img src={logoSrc} alt="Passport ATL" className="h-12 w-auto" />
          <span className="rounded-full border-2 border-foreground bg-brand-yellow px-3 py-1 font-display text-xs uppercase tracking-wider">
            Partner Portal
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}

export default function PartnerPortal() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "denied" | "error"
  >("loading");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    setStatus("loading");
    fetch("/api/partner/session", { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          if (active) setStatus("denied");
          return;
        }
        if (!response.ok) throw new Error("Partner session failed");
        const body = (await response.json()) as PartnerSession;
        if (active) {
          setSession(body);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <PartnerFrame>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
        </div>
      </PartnerFrame>
    );
  }

  if (!isSignedIn) {
    return (
      <PartnerFrame>
        <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-brand-lime px-4 py-2 font-bold">
              <ShieldCheck className="h-5 w-5" />
              Separate, secure partner access
            </div>
            <h1 className="font-display text-4xl leading-tight sm:text-6xl">
              Manage your Passport ATL partnership.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Sign in to view organizations connected to your approved partner
              account. A personal Passport using the same email remains
              separate.
            </p>
          </div>
          <SignIn
            routing="path"
            path={`${basePath}/partners`}
            fallbackRedirectUrl={`${basePath}/partners`}
          />
        </section>
      </PartnerFrame>
    );
  }

  if (status === "loading") {
    return (
      <PartnerFrame>
        <div className="flex min-h-[50vh] items-center justify-center gap-3 font-bold">
          <Loader2 className="h-6 w-6 animate-spin" />
          Verifying partner access
        </div>
      </PartnerFrame>
    );
  }

  if (status === "denied" || status === "error" || !session) {
    return (
      <PartnerFrame>
        <section className="card-pop mx-auto max-w-2xl bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl">Partner access not active</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Your sign-in is valid, but it is not connected to an active Passport
            ATL partner organization. Contact our team if you are waiting for an
            invitation or approval.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/passport/contact"
              className="button-pop button-pop-yellow"
            >
              Contact Passport ATL
            </a>
            <button
              type="button"
              className="button-pop button-pop-cream inline-flex items-center gap-2"
              onClick={() => void signOut({ redirectUrl: "/partners" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </section>
      </PartnerFrame>
    );
  }

  return (
    <PartnerFrame>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-bold text-muted-foreground">
            Signed in as {session.account.primaryEmail}
          </p>
          <h1 className="mt-1 font-display text-4xl">
            Welcome, {session.account.displayName}
          </h1>
        </div>
        <button
          type="button"
          className="button-pop button-pop-cream inline-flex items-center gap-2"
          onClick={() => void signOut({ redirectUrl: "/partners" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Your organizations</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {session.memberships.map((membership) => (
            <article key={membership.id} className="card-pop bg-white p-6">
              <Building2 className="h-8 w-8 text-brand-red" />
              <h3 className="mt-4 font-display text-2xl">
                {membership.organizationName}
              </h3>
              <p className="mt-2 capitalize text-muted-foreground">
                {membership.role} access
              </p>
              <p className="mt-5 text-sm font-bold">
                Listing management is being enabled in the next launch slice.
              </p>
            </article>
          ))}
        </div>
      </section>
    </PartnerFrame>
  );
}
