import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Partners from "@/pages/partners";
import EventDetail from "@/pages/event-detail";
import RouteDetail from "@/pages/route-detail";
import Apply from "@/pages/apply";
import Listing from "@/pages/listing";
import StampPage from "@/pages/stamp";
import PassportContact from "@/pages/passport/contact";
import AdminStamps from "@/pages/admin-stamps";
import AdminApplications from "@/pages/admin-applications";
import { VisitorProvider } from "@/passport/VisitorProvider";
import { PassportLayout } from "@/passport/PassportLayout";
import MapShell from "@/passport/MapShell";
import { ClerkProviders, SignInPage, SignUpPage } from "@/auth/clerk";

const queryClient = new QueryClient();

function MarketingRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/partners" component={Partners} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/routes/:id" component={RouteDetail} />
        <Route path="/apply" component={Apply} />
        <Route path="/listing/:id" component={Listing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Account gating is ON: signed-out visitors are redirected to the marketing
// home from any protected route. Set to true to allow signed-out access to
// every page (e.g. while designing the passport pages).
const ALLOW_PUBLIC_ACCESS = false;

// Almost everything requires a registered account. Only the marketing home (`/`),
// partners, and apply pages stay open to signed-out visitors. Sign-in/up,
// the /stamp QR landing, and admin are functional routes that must also stay reachable.
function isProtectedRoute(location: string) {
  const publicExact = ["/", "/partners", "/apply"];
  if (publicExact.includes(location)) return false;
  const publicPrefixes = ["/sign-in", "/sign-up", "/stamp/", "/admin/"];
  if (publicPrefixes.some((p) => location === p || location.startsWith(p))) {
    return false;
  }
  return true;
}

// Send signed-out visitors who hit a protected route back to the marketing home.
// Unlike SignedInHomeRedirect this fires on every navigation so a signed-out
// user can never linger on a gated page.
function ProtectedRouteRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoaded) return;
    if (!ALLOW_PUBLIC_ACCESS && !isSignedIn && isProtectedRoute(location)) {
      setLocation("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, location, setLocation]);
  return null;
}

// Routes that share the persistent, never-reloading map shell.
function isMapShellRoute(location: string) {
  return (
    location === "/passport" ||
    location === "/passport/explore" ||
    location === "/passport/events" ||
    location === "/passport/stamps" ||
    location === "/passport/routes"
  );
}

// Keeps the map shell (and its Google map) mounted once it's first visited,
// toggling visibility instead of unmounting — so the map never reloads or
// recenters when the user navigates between Explore, Events, and other pages.
function PersistentMapShell() {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  // Never mount the map (or its Google map) for a signed-out visitor — they're
  // being redirected to the marketing home.
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
  if (location === "/admin/stamps") {
    return <AdminStamps />;
  }
  if (location === "/admin/applications") {
    return <AdminApplications />;
  }
  if (isProtectedRoute(location)) {
    // Render nothing while Clerk resolves or while a signed-out user is being
    // redirected to the marketing home — never flash gated content.
    if (!isLoaded || (!isSignedIn && !ALLOW_PUBLIC_ACCESS)) {
      return null;
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
