import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Kickoff from "./pages/Kickoff";
import Intake from "./pages/Intake";
import Artifacts from "./pages/Artifacts";
import Interviews from "./pages/Interviews";
import Survey from "./pages/Survey";
import SIPOC from "./pages/SIPOC";
import Workflow from "./pages/Workflow";
import Baseline from "./pages/Baseline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kickoff" element={<Kickoff />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/sipoc" element={<SIPOC />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/baseline" element={<Baseline />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
