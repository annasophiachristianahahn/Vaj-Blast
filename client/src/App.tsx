import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CoinFlip from "@/pages/CoinFlip";
import QuietGame from "@/pages/QuietGame";
import BlockBlast from "@/pages/BlockBlast";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/coin-flip" component={CoinFlip} />
      <Route path="/quiet-game" component={QuietGame} />
      <Route path="/block-blast" component={BlockBlast} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
