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
import Constraint from "./pages/Constraint";
import Artifacts from "./pages/Artifacts";
import Interviews from "./pages/Interviews";
import Survey from "./pages/Survey";
import SIPOC from "./pages/SIPOC";
import Workflow from "./pages/Workflow";
import Baseline from "./pages/Baseline";
import FlowStabilization from "./pages/FlowStabilization";
import ScopeDiscipline from "./pages/ScopeDiscipline";
import Synthesis from "./pages/Synthesis";
import Readout from "./pages/Readout";
import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import Welcome from "./pages/Welcome";
import NoWorkspace from "./pages/NoWorkspace";
import NotFound from "./pages/NotFound";
import ClientHub from "./pages/ClientHub";
// RPE Health Check
import RPEHealthCheck from "./modules/rpe/RPEHealthCheck";
// Scope Creep module
import ScopeCreepInit from "./pages/scope-creep/ScopeCreepInit";
import ScopeCreepAssessment from "./pages/scope-creep/ScopeCreepAssessment";
import ScopeCreepStep1 from "./pages/scope-creep/ScopeCreepStep1";
import ScopeCreepStep2 from "./pages/scope-creep/ScopeCreepStep2";
import ScopeCreepStep3 from "./pages/scope-creep/ScopeCreepStep3";
import ScopeCreepStep4 from "./pages/scope-creep/ScopeCreepStep4";
import ScopeCreepStep5 from "./pages/scope-creep/ScopeCreepStep5";

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
              path="/constraint"
              element={
                <RequireWorkspace>
                  <Constraint />
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
              path="/flow-stabilization"
              element={
                <RequireWorkspace>
                  <FlowStabilization />
                </RequireWorkspace>
              }
            />
            <Route
              path="/scope-discipline"
              element={
                <RequireWorkspace>
                  <ScopeDiscipline />
                </RequireWorkspace>
              }
            />
            <Route
              path="/synthesis"
              element={
                <RequireWorkspace>
                  <Synthesis />
                </RequireWorkspace>
              }
            />
            <Route
              path="/readout"
              element={
                <RequireWorkspace>
                  <Readout />
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
            {/* ── Client Hub ────────────────────────────────────────── */}
            <Route
              path="/client/:clientId"
              element={
                <RequireWorkspace>
                  <ClientHub />
                </RequireWorkspace>
              }
            />
            {/* ── RPE Health Check ─────────────────────────────────────── */}
            <Route
              path="/rpe"
              element={
                <RequireWorkspace>
                  <RPEHealthCheck />
                </RequireWorkspace>
              }
            />
            <Route
              path="/rpe/:clientId"
              element={
                <RequireWorkspace>
                  <RPEHealthCheck />
                </RequireWorkspace>
              }
            />
            {/* ── Scope Creep Module ───────────────────────────────────── */}
            <Route
              path="/scope-creep/:clientId"
              element={
                <RequireWorkspace>
                  <ScopeCreepInit />
                </RequireWorkspace>
              }
            />
            <Route
              path="/scope-creep/assessment/:id"
              element={
                <RequireWorkspace>
                  <ScopeCreepAssessment />
                </RequireWorkspace>
              }
            >
              <Route path="step/1" element={<ScopeCreepStep1 />} />
              <Route path="step/2" element={<ScopeCreepStep2 />} />
              <Route path="step/3" element={<ScopeCreepStep3 />} />
              <Route path="step/4" element={<ScopeCreepStep4 />} />
              <Route path="step/5" element={<ScopeCreepStep5 />} />
              <Route index element={<Navigate to="step/1" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WorkspaceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
