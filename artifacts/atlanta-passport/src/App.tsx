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
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import About from "@/pages/about";
import Apply from "@/pages/apply";
import Contact from "@/pages/contact";
import Listing from "@/pages/listing";
import Beltline from "@/pages/beltline";
import StampPage from "@/pages/stamp";
import PassportHome from "@/pages/passport/index";
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
        <Route path="/beltline" component={Beltline} />
        <Route path="/routes" component={Beltline} />
        <Route path="/partners" component={Partners} />
        <Route path="/events" component={Events} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/about" component={About} />
        <Route path="/apply" component={Apply} />
        <Route path="/contact" component={Contact} />
        <Route path="/listing/:id" component={Listing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Almost everything requires a registered account. Only the marketing home (`/`)
// and the contact page stay open to signed-out visitors. Sign-in/up, the /stamp
// QR landing, and admin are functional routes that must also stay reachable.
function isProtectedRoute(location: string) {
  const publicExact = ["/", "/contact"];
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
    if (!isSignedIn && isProtectedRoute(location)) {
      setLocation("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, location, setLocation]);
  return null;
}

// Routes that share the persistent, never-reloading map shell.
function isMapShellRoute(location: string) {
  return (
    location === "/explore" ||
    location === "/explore/events" ||
    location === "/passport/stamps" ||
    location === "/passport/rewards" ||
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
  const isShell = isMapShellRoute(location) && isLoaded && isSignedIn;
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
        <Route path="/passport" component={PassportHome} />
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
    if (!isLoaded || !isSignedIn) {
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
