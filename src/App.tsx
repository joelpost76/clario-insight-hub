import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { RequireWorkspace } from "@/components/RequireWorkspace";
import { RequireAdmin } from "@/components/RequireAdmin";
import Auth from "./pages/Auth";
import GetStarted from "./pages/GetStarted";
import ServiceConfiguration from "./pages/ServiceConfiguration";
import ThankYou from "./pages/ThankYou";
import Dashboard from "./pages/Dashboard";
import Kickoff from "./pages/Kickoff";
import Intake from "./pages/Intake";
import Artifacts from "./pages/Artifacts";
import Interviews from "./pages/Interviews";
import Survey from "./pages/Survey";
import SIPOC from "./pages/SIPOC";
import Workflow from "./pages/Workflow";
import Baseline from "./pages/Baseline";
import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import Welcome from "./pages/Welcome";
import NoWorkspace from "./pages/NoWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WorkspaceProvider>
          <Routes>
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/get-started/configure" element={<ServiceConfiguration />} />
            <Route path="/get-started/thank-you" element={<ThankYou />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/no-workspace" element={<NoWorkspace />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <RequireAdmin>
                  <AdminLeads />
                </RequireAdmin>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireWorkspace>
                  <Dashboard />
                </RequireWorkspace>
              }
            />
            <Route
              path="/kickoff"
              element={
                <RequireWorkspace>
                  <Kickoff />
                </RequireWorkspace>
              }
            />
            <Route
              path="/intake"
              element={
                <RequireWorkspace>
                  <Intake />
                </RequireWorkspace>
              }
            />
            <Route
              path="/artifacts"
              element={
                <RequireWorkspace>
                  <Artifacts />
                </RequireWorkspace>
              }
            />
            <Route
              path="/interviews"
              element={
                <RequireWorkspace>
                  <Interviews />
                </RequireWorkspace>
              }
            />
            <Route
              path="/survey"
              element={
                <RequireWorkspace>
                  <Survey />
                </RequireWorkspace>
              }
            />
            <Route
              path="/sipoc"
              element={
                <RequireWorkspace>
                  <SIPOC />
                </RequireWorkspace>
              }
            />
            <Route
              path="/workflow"
              element={
                <RequireWorkspace>
                  <Workflow />
                </RequireWorkspace>
              }
            />
            <Route
              path="/baseline"
              element={
                <RequireWorkspace>
                  <Baseline />
                </RequireWorkspace>
              }
            />
            <Route
              path="/welcome"
              element={
                <RequireWorkspace>
                  <Welcome />
                </RequireWorkspace>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WorkspaceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
