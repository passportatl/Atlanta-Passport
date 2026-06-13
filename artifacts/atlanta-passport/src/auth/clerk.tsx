import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useClerk,
  useUser,
} from "@clerk/react";
import { useSignUp } from "@clerk/react/legacy";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLinkVisitor, type Visitor } from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly),
// auto-set in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const NAVY = "#0E2438";
const INK = "#141414";
const MUTED = "#5C5C5C";
const YELLOW = "#F6C026";
const RED = "#D6293B";
const CREAM = "#F7F4EC";

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: NAVY,
    colorForeground: INK,
    colorMutedForeground: MUTED,
    colorDanger: RED,
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: INK,
    colorNeutral: INK,
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.6rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-[420px] max-w-full overflow-hidden border-2 border-[#141414] shadow-[6px_6px_0_0_#141414]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: {
      color: INK,
      fontFamily: "'Bungee', sans-serif",
      fontSize: "1.1rem",
      letterSpacing: "0.01em",
    },
    headerSubtitle: { color: MUTED },
    socialButtonsBlockButton:
      "border-2 border-[#141414] bg-white hover:bg-[#F7F4EC] rounded-lg shadow-[3px_3px_0_0_#141414]",
    socialButtonsBlockButtonText: { color: INK, fontWeight: 700 },
    dividerLine: "bg-[#141414]/15",
    dividerText: {
      color: MUTED,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontSize: "0.72rem",
    },
    formFieldLabel: {
      color: INK,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      fontSize: "0.72rem",
    },
    formFieldInput:
      "border-2 border-[#141414] bg-white rounded-lg text-[#141414]",
    formButtonPrimary:
      "bg-[#F6C026] text-[#141414] border-2 border-[#141414] rounded-lg font-extrabold shadow-[3px_3px_0_0_#141414] hover:bg-[#f3b80a] normal-case",
    footerActionText: { color: MUTED },
    footerActionLink: "text-[#D6293B] font-bold hover:text-[#b81f30]",
    identityPreviewEditButton: "text-[#D6293B]",
    formFieldSuccessText: { color: "#1a7a3a" },
    formFieldErrorText: { color: RED },
    alertText: { color: RED },
    logoBox: "justify-center",
    logoImage: "h-12 w-auto",
    otpCodeFieldInput: "border-2 border-[#141414] text-[#141414]",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to your Atlanta Passport",
    },
  },
  signUp: {
    start: {
      title: "Create your passport",
      subtitle: "Free — explore Atlanta & collect stamps",
    },
  },
};

export function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/passport/stamps`}
      />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/passport/stamps`}
      />
    </div>
  );
}

// Invalidate the React Query cache when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Bridges a Clerk-authenticated account to the existing visitor/passport
// system. While signed in it asks the server to get-or-create the visitor
// linked to this account (by clerkUserId) and makes that the active visitor —
// so the same account resolves to the same passport on every device. On
// sign-out or account switch it drops the previously linked visitor so a
// shared device never leaves one account bound to another's passport.
// Purely-anonymous visitors (created via the email form, never linked to a
// Clerk account) are left untouched.
function ClerkVisitorBridge() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { setVisitorId, setLinkedReady } = useVisitor();
  const { mutateAsync } = useLinkVisitor();
  const linkedForUserId = useRef<string | null>(null);
  const linking = useRef(false);
  const attempts = useRef(0);
  const [retryTick, setRetryTick] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Only clear if THIS session previously linked a Clerk account.
      if (linkedForUserId.current !== null) {
        linkedForUserId.current = null;
        setVisitorId(null);
      }
      setLinkedReady(false);
      attempts.current = 0;
      return;
    }

    if (linkedForUserId.current === userId || linking.current) return;

    // A sign-in (or account switch) is not yet confirmed-linked: until the
    // link call below resolves, the active visitorId may be stale localStorage
    // state, so consumers must not treat it as account-bound.
    setLinkedReady(false);

    // Account switch: drop the prior account's visitor before relinking.
    if (linkedForUserId.current !== null) {
      setVisitorId(null);
      attempts.current = 0;
    }

    linking.current = true;
    (async () => {
      try {
        const v = (await mutateAsync()) as Visitor;
        if (v?.id) {
          linkedForUserId.current = userId;
          attempts.current = 0;
          setVisitorId(v.id);
          setLinkedReady(true);
        }
      } catch {
        // Retry with backoff so a transient /visitors/link failure doesn't
        // leave a just-signed-in user without a passport. Auth state is
        // stable here, so deps won't change on their own — bump retryTick.
        if (attempts.current < 5) {
          const delay = Math.min(1000 * 2 ** attempts.current, 15000);
          attempts.current += 1;
          setTimeout(() => setRetryTick((t) => t + 1), delay);
        }
      } finally {
        linking.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, userId, retryTick, setVisitorId, setLinkedReady, mutateAsync]);

  return null;
}

// When a signed-in account lands on the marketing home route, send them
// straight to Explore — the home page is the public marketing site, signed-in
// visitors want their guide. Uses replace so the back button doesn't bounce.
function SignedInHomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  // Only the first load counts as "visiting the site" — after Clerk resolves
  // once we stop auto-redirecting, so a signed-in user can click the logo to
  // intentionally return to the marketing home without being bounced back.
  const evaluated = useRef(false);

  useEffect(() => {
    if (!isLoaded || evaluated.current) return;
    evaluated.current = true;
    if (isSignedIn && location === "/") {
      setLocation("/passport/stamps", { replace: true });
    }
  }, [isLoaded, isSignedIn, location, setLocation]);

  return null;
}

export function ClerkProviders({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <ClerkVisitorBridge />
      <SignedInHomeRedirect />
      {children}
    </ClerkProvider>
  );
}

type Provider = "oauth_google" | "oauth_apple" | "oauth_x" | "oauth_facebook";

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.29-.88-2.31-3.48ZM14.2 5.9c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.55 1.31-.56.64-1.05 1.68-.92 2.67.97.07 1.96-.49 2.57-1.22Z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.69l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

const GLYPHS: Record<Provider, ReactNode> = {
  oauth_google: <GoogleGlyph />,
  oauth_apple: <AppleGlyph />,
  oauth_x: <XGlyph />,
  oauth_facebook: <FacebookGlyph />,
};

const LABELS: Record<Provider, string> = {
  oauth_google: "Google",
  oauth_apple: "Apple",
  oauth_x: "X",
  oauth_facebook: "Facebook",
};

const PROVIDERS: Provider[] = [
  "oauth_google",
  "oauth_apple",
  "oauth_x",
  "oauth_facebook",
];

// One-click social registration buttons used inside StartPassportForm.
// Each kicks off Clerk's OAuth redirect; the /sign-up route finalizes the
// callback, after which the visitor bridge links the account to a passport.
export function SocialAuthButtons() {
  const { signUp, isLoaded } = useSignUp();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (provider: Provider) => {
    if (!isLoaded || !signUp) return;
    setError(null);
    setBusy(provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: `${basePath}/sign-up/sso-callback`,
        redirectUrlComplete: `${basePath}/passport/stamps`,
      });
    } catch {
      setError(`Couldn't start ${LABELS[provider]} sign-up. Please try again.`);
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {PROVIDERS.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={!isLoaded || busy !== null}
          onClick={() => start(provider)}
          className="w-full flex items-center justify-center gap-2.5 border-2 border-foreground rounded-lg bg-white px-4 py-2.5 font-bold text-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] transition hover:bg-brand-cream disabled:opacity-60"
        >
          {GLYPHS[provider]}
          {busy === provider ? "Redirecting…" : `Continue with ${LABELS[provider]}`}
        </button>
      ))}
      {error && (
        <div className="text-sm text-[hsl(var(--brand-red))] font-bold text-center">
          {error}
        </div>
      )}
    </div>
  );
}
