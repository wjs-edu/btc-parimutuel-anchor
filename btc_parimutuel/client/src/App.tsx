import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PartnerProofHub from "@/pages/PartnerProofHub";
import CanceledVerifier from "@/pages/CanceledVerifier";
import ResolvedVerifier from "@/pages/ResolvedVerifier";
import StatusRenderer from "@/pages/StatusRenderer";
import RestrictedRegion from "@/pages/RestrictedRegion";
import { MID_DEFAULT } from "@/lib/constants";

function Router() {
  return (
    <Switch>
      <Route path="/proof/:mid" component={PartnerProofHub} />
      <Route path="/verify/canceled/:mid" component={CanceledVerifier} />
      <Route path="/verify/resolved/:mid" component={ResolvedVerifier} />
      <Route path="/status/:mid" component={StatusRenderer} />
      <Route path="/restricted" component={RestrictedRegion} />
      
      {/* Redirect root to the proof hub for the default MID */}
      <Route path="/">
        <Redirect to={`/proof/${MID_DEFAULT}`} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
