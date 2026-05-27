import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Partners from "@/pages/partners";
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import About from "@/pages/about";
import Apply from "@/pages/apply";
import Listing from "@/pages/listing";
import Beltline from "@/pages/beltline";
import StampPage from "@/pages/stamp";
import PassportHome from "@/pages/passport/index";
import PassportStamps from "@/pages/passport/stamps";
import PassportRewards from "@/pages/passport/rewards";
import PassportRoutes from "@/pages/passport/routes";
import AdminStamps from "@/pages/admin-stamps";
import AdminApplications from "@/pages/admin-applications";
import { VisitorProvider } from "@/passport/VisitorProvider";
import { PassportLayout } from "@/passport/PassportLayout";

const queryClient = new QueryClient();

function MarketingRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/beltline" component={Beltline} />
        <Route path="/routes" component={Beltline} />
        <Route path="/explore" component={Explore} />
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

function PassportRoutesGroup() {
  return (
    <PassportLayout>
      <Switch>
        <Route path="/passport" component={PassportHome} />
        <Route path="/passport/stamps" component={PassportStamps} />
        <Route path="/passport/rewards" component={PassportRewards} />
        <Route path="/passport/routes" component={PassportRoutes} />
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
          </WouterRouter>
          <Toaster />
        </VisitorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
