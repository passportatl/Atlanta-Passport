import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Partners from "@/pages/partners";
import PartnersComingSoon from "@/pages/partners-coming-soon";
import EventDetail from "@/pages/event-detail";
import RouteDetail from "@/pages/route-detail";
import Apply from "@/pages/apply";
import ListEvent from "@/pages/list-event";
import Listing from "@/pages/listing";
import StampPage from "@/pages/stamp";
import RedeemPage from "@/pages/redeem";
import PassportContact from "@/pages/passport/contact";
import PassportConsent from "@/pages/passport/consent";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import AdminStamps from "@/pages/admin-stamps";
import AdminApplications from "@/pages/admin-applications";
import AdminContent from "@/pages/admin-content";
import AdminRoutes from "@/pages/admin-routes";
import ListALocation from "@/pages/list-a-location";
import { VisitorProvider } from "@/passport/VisitorProvider";
import {
  hasCurrentLegalConsent,
  useVisitor,
  PENDING_STAMP_KEY,
} from "@/passport/visitor-context";
import { PassportLayout } from "@/passport/PassportLayout";
import MapShell from "@/passport/MapShell";
import { ClerkProviders, SignInPage, SignUpPage } from "@/auth/clerk";
import { isProtectedRoute, MEMBER_HOME_ROUTE } from "@/auth/route-access";

const queryClient = new QueryClient();

function MarketingRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        {/* TEMPORARY: partner applications paused — /partners shows a holding page.
            To revert, change `PartnersComingSoon` back to `Partners` (the real page
            is still imported above and fully intact). */}
        <Route path="/partners" component={ListALocation} />
        <Route path="/list-a-location" component={ListALocation} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/routes/:id" component={RouteDetail} />
        {/* TEMPORARY: applications paused — /apply shows the same holding page
            as /partners. To revert, change `PartnersComingSoon` back to `Apply`
            (the real page is still imported above and fully intact). */}
        <Route path="/apply" component={PartnersComingSoon} />
        {/* Event submissions stay open while partner applications are paused:
            /list-event renders the full event listing form. */}
        <Route path="/list-event" component={ListEvent} />
        <Route path="/listing/:id" component={Listing} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Account gating is ON: signed-out visitors are redirected to the marketing
// home from any protected route. Set to true to allow signed-out access to
// every page (e.g. while designing the passport pages).
const ALLOW_PUBLIC_ACCESS = false;

// Gate protected routes for signed-out visitors. The marketing home is always
// the FIRST page an unregistered visitor sees: if their entry point (a fresh
// load, deep link, or refresh) is a gated route, send them to the marketing
// home rather than the sign-up page. Once they're in-session, clicking any
// gated link funnels them to sign-up to create an account.
function ProtectedRouteRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  // False until Clerk has resolved once — distinguishes the initial page load
  // (their "first page") from later in-session navigation.
  const initialLoadHandled = useRef(false);
  useEffect(() => {
    if (!isLoaded) return;
    if (ALLOW_PUBLIC_ACCESS || isSignedIn) {
      initialLoadHandled.current = true;
      return;
    }
    if (isProtectedRoute(location)) {
      setLocation(initialLoadHandled.current ? "/sign-up" : "/", {
        replace: true,
      });
    }
    initialLoadHandled.current = true;
  }, [isLoaded, isSignedIn, location, setLocation]);
  return null;
}

// A signed-in visitor never needs the sign-in/up pages — bounce them to their
// passport home (the Stamps page). Combined with ProtectedRouteRedirect this
// makes the sign-up page the single funnel: signed-out visitors land there to
// register, signed-in visitors pass straight through to their stamps.
function SignedInAuthRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // If a stamp scan is pending, PendingStampRedirect owns the destination.
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(PENDING_STAMP_KEY)
    ) {
      return;
    }
    if (location.startsWith("/sign-in") || location.startsWith("/sign-up")) {
      setLocation(MEMBER_HOME_ROUTE, { replace: true });
    }
  }, [isLoaded, isSignedIn, location, setLocation]);
  return null;
}

function ConsentRequirementRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const { visitor, linkedReady } = useVisitor();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !linkedReady || !visitor) return;
    const needsConsent = !hasCurrentLegalConsent(visitor);
    const isConsentPage = location === "/passport/consent";
    const isConsumerRoute =
      location === "/passport" ||
      location.startsWith("/passport/") ||
      location.startsWith("/stamp/") ||
      location.startsWith("/redeem/");

    if (needsConsent && isConsumerRoute && !isConsentPage) {
      setLocation("/passport/consent", { replace: true });
    } else if (!needsConsent && isConsentPage) {
      setLocation(MEMBER_HOME_ROUTE, { replace: true });
    }
  }, [isLoaded, isSignedIn, linkedReady, visitor, location, setLocation]);

  return null;
}

// QR-scan stamp flow: an unauthenticated visitor who scans a stamp QR is asked
// to log in / create a passport. Once Clerk reports them signed in AND their
// passport (visitorId) is linked, send them straight back to the stamp page so
// it auto-collects into their account — regardless of where auth landed them
// (hosted sign-in falls back to /passport/stamps; social OAuth returns there
// too). The stamp page clears the pending key after collecting.
function PendingStampRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const { visitorId, visitor, linkedReady } = useVisitor();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      !linkedReady ||
      !visitorId ||
      !hasCurrentLegalConsent(visitor)
    )
      return;
    if (typeof window === "undefined") return;
    const pending = window.localStorage.getItem(PENDING_STAMP_KEY);
    if (!pending) return;
    const target = `/stamp/${pending}`;
    if (location !== target) setLocation(target, { replace: true });
  }, [
    isLoaded,
    isSignedIn,
    linkedReady,
    visitorId,
    visitor,
    location,
    setLocation,
  ]);
  return null;
}

// Routes that share the persistent, never-reloading map shell.
function isMapShellRoute(location: string) {
  return (
    location === "/passport" ||
    location === "/passport/explore" ||
    location === "/passport/events" ||
    location.startsWith("/passport/events/") ||
    location === "/passport/stamps" ||
    location === "/passport/routes" ||
    location.startsWith("/passport/routes/")
  );
}

// Keeps the map shell (and its Google map) mounted once it's first visited,
// toggling visibility instead of unmounting — so the map never reloads or
// recenters when the user navigates between Explore, Events, and other pages.
function PersistentMapShell() {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  // Never mount the map (or its Google map) for a signed-out visitor — they're
  // being redirected to the sign-up page.
  const isShell =
    isMapShellRoute(location) &&
    isLoaded &&
    (isSignedIn || ALLOW_PUBLIC_ACCESS);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (isShell) setMounted(true);
  }, [isShell]);
  if (!mounted) return null;
  return (
    <div
      aria-hidden={!isShell}
      className="fixed inset-0 z-30"
      style={{ visibility: isShell ? "visible" : "hidden" }}
    >
      <MapShell />
    </div>
  );
}

function PassportRoutesGroup() {
  return (
    <PassportLayout>
      <Switch>
        <Route path="/passport/contact" component={PassportContact} />
        <Route path="/passport/consent" component={PassportConsent} />
        <Route component={NotFound} />
      </Switch>
    </PassportLayout>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  if (location.startsWith("/sign-in") || location.startsWith("/sign-up")) {
    // Already signed in? Don't flash the auth UI — SignedInAuthRedirect is
    // sending them to their stamps page.
    if (isLoaded && isSignedIn) return null;
    return (
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
      </Switch>
    );
  }
  if (location.startsWith("/stamp/")) {
    return (
      <Switch>
        <Route path="/stamp/:businessSlug" component={StampPage} />
      </Switch>
    );
  }
  // Contact is reachable to everyone (opened in its own tab from the marketing
  // nav), so render it before the protected-route gate.
  if (location === "/passport/contact") {
    return <PassportRoutesGroup />;
  }
  if (isProtectedRoute(location)) {
    // Render nothing while Clerk resolves or while a signed-out user is being
    // redirected (to the marketing home or sign-up) — never flash gated content.
    if (!isLoaded || (!isSignedIn && !ALLOW_PUBLIC_ACCESS)) {
      return null;
    }
    if (location.startsWith("/redeem/")) {
      return (
        <Switch>
          <Route path="/redeem/:tier" component={RedeemPage} />
        </Switch>
      );
    }
    if (location === "/admin" || location === "/admin/applications") {
      return <AdminApplications />;
    }
    if (location === "/admin/stamps") {
      return <AdminStamps />;
    }
    if (location === "/admin/content") {
      return <AdminContent />;
    }
    if (location === "/admin/routes") {
      return <AdminRoutes />;
    }
    if (isMapShellRoute(location)) {
      return null;
    }
    if (location === "/passport" || location.startsWith("/passport/")) {
      return <PassportRoutesGroup />;
    }
  }
  return <MarketingRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisitorProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ClerkProviders>
              <ScrollToTop />
              <ProtectedRouteRedirect />
              <SignedInAuthRedirect />
              <ConsentRequirementRedirect />
              <PendingStampRedirect />
              <Router />
              <PersistentMapShell />
            </ClerkProviders>
          </WouterRouter>
          <Toaster />
        </VisitorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
