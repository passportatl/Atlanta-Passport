import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import Listing from "@/pages/listing";
import Beltline from "@/pages/beltline";
import StampPage from "@/pages/stamp";
import PassportHome from "@/pages/passport/index";
import AdminStamps from "@/pages/admin-stamps";
import AdminApplications from "@/pages/admin-applications";
import { VisitorProvider } from "@/passport/VisitorProvider";
import { PassportLayout } from "@/passport/PassportLayout";
import MapShell from "@/passport/MapShell";

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
        <Route path="/listing/:id" component={Listing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
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
  const isShell = isMapShellRoute(location);
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
  if (isMapShellRoute(location)) {
    return null;
  }
  if (location === "/passport" || location.startsWith("/passport/")) {
    return <PassportRoutesGroup />;
  }
  return <MarketingRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisitorProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Router />
            <PersistentMapShell />
          </WouterRouter>
          <Toaster />
        </VisitorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
