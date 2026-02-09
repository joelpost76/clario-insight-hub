import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowRight,
  Rocket,
  ClipboardList,
  FileStack,
  Users,
  BarChart3,
  GitBranch,
  Workflow,
  Activity,
  ChevronDown,
  Lightbulb,
  Target,
  Clock,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const WELCOME_SEEN_PREFIX = "welcome_seen_";

interface Phase {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  purpose: string;
  duration: string;
  clientRole: string;
  consultantTip: string;
}

const phases: Phase[] = [
  {
    title: "Kickoff",
    icon: Rocket,
    purpose:
      "Align on 90-day outcomes, define scope (workflows and teams), and set constraints. This frames the entire diagnostic.",
    duration: "Day 1",
    clientRole: "Share strategic priorities and non-negotiables with the consultant.",
    consultantTip:
      "Push for specificity on outcomes. Vague goals like 'improve efficiency' need to become measurable targets. Capture constraints early — they prevent scope creep later.",
  },
  {
    title: "Intake Questionnaire",
    icon: ClipboardList,
    purpose:
      "Surface recurring pain points, bottleneck patterns, and existing metrics through structured questions rooted in Constraint Thinking.",
    duration: "Day 1–2",
    clientRole: "Answer candidly — there are no wrong answers. Focus on what actually happens, not what should happen.",
    consultantTip:
      "Use TOC framing: 'If you could fix one thing…' questions reveal the system constraint. Look for wait points and replanning triggers — they indicate hidden queues.",
  },
  {
    title: "Artifacts",
    icon: FileStack,
    purpose:
      "Collect process documents, SOPs, org charts, tool screenshots, and any reference material that shows how work actually flows today.",
    duration: "Day 2–3",
    clientRole: "Provide what you have. Even incomplete or outdated documents are valuable for comparison.",
    consultantTip:
      "Don't wait for perfect documents. Artifacts reveal the gap between documented process and reality. Tag by type for easy reference during mapping.",
  },
  {
    title: "Interviews",
    icon: Users,
    purpose:
      "One-on-one conversations with key stakeholders to uncover qualitative insights, hidden friction, and tribal knowledge.",
    duration: "Day 3–5",
    clientRole: "Interviews are confidential. Share what's working and what isn't — both are equally important.",
    consultantTip:
      "Schedule by role, not seniority. Front-line operators often see bottlenecks that managers don't. Code themes as you go — don't wait until all interviews are done.",
  },
  {
    title: "Team Survey",
    icon: BarChart3,
    purpose:
      "Quantitative pulse-check across the team to measure pain severity, burnout risk, and validate themes from interviews.",
    duration: "Day 4–6",
    clientRole: "Encourage your team to respond honestly. Higher response rates produce more reliable insights.",
    consultantTip:
      "Target 70%+ response rate for statistical relevance. Compare burnout risk scores against pain ratings — mismatches indicate coping mechanisms masking real issues.",
  },
  {
    title: "SIPOC Mapping",
    icon: GitBranch,
    purpose:
      "Define Suppliers, Inputs, Process steps, Outputs, and Customers for each workflow in scope. Creates a shared high-level view.",
    duration: "Day 5–7",
    clientRole: "Validate that the documented process matches reality. Flag any missing steps or handoffs.",
    consultantTip:
      "Start with outputs and customers, then work backwards. This prevents teams from over-detailing early steps while skipping the end. Keep it at 5–8 process steps max.",
  },
  {
    title: "Workflow Mapping",
    icon: Workflow,
    purpose:
      "Detail each workflow step including handoffs, wait queues, decision points, and rework loops. This is where constraints become visible.",
    duration: "Day 6–8",
    clientRole: "Walk the consultant through a real work item's journey. Where does it wait? Where does it bounce back?",
    consultantTip:
      "Map queues explicitly — they're where lead time hides. Mark rework loops with frequency estimates. Handoff points between teams are usually where work stalls.",
  },
  {
    title: "Flow Baseline",
    icon: Activity,
    purpose:
      "Establish quantitative metrics: WIP count, throughput, lead time, rework rate, and billing cycle. These become the 'before' snapshot.",
    duration: "Day 7–10",
    clientRole: "Provide access to relevant data sources. Estimates are acceptable when exact data isn't available.",
    consultantTip:
      "At least 3 of 5 metrics needed to establish a baseline. Use confidence levels — a rough baseline is better than none. AR aging data often reveals hidden cash flow constraints.",
  },
];

const faqItems = [
  {
    question: "How long does the diagnostic take?",
    answer:
      "The standard Clario™ Diagnostic runs over 10 business days. Your consultant will manage the pace and keep things on track.",
  },
  {
    question: "What will I need to provide?",
    answer:
      "Access to key stakeholders for interviews (30–45 min each), existing process documents, and team availability for a brief survey. Your consultant will guide you through each step.",
  },
  {
    question: "What do I receive at the end?",
    answer:
      "A comprehensive readout including: validated workflow maps, constraint analysis, flow metrics baseline, prioritised improvement opportunities, and a recommended action plan.",
  },
  {
    question: "Is the information confidential?",
    answer:
      "Absolutely. All interview notes, survey responses, and diagnostic data are kept strictly confidential. Aggregated themes are shared, never individual attributions.",
  },
  {
    question: "What happens after the diagnostic?",
    answer:
      "Your consultant will present findings in a readout session and recommend next steps. The diagnostic provides the evidence base for targeted improvements with the highest ROI.",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { workspaceId, userRole } = useWorkspace();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showConsultantTips, setShowConsultantTips] = useState(
    userRole === "unburnt_admin"
  );

  const isConsultant = userRole === "unburnt_admin";

  const handleContinue = () => {
    if (workspaceId) {
      localStorage.setItem(`${WELCOME_SEEN_PREFIX}${workspaceId}`, "true");
    }
    navigate("/dashboard");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-10 pb-16">
        {/* Hero */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wider">
              Clario™ Diagnostic
            </Badge>
            {isConsultant && (
              <Badge variant="outline" className="text-xs">
                Consultant View
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome to Your Diagnostic Workspace
          </h1>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            Over the next 10 days, we'll work together to map your workflows,
            identify constraints, and build a clear picture of where the highest-value
            improvements live. This page outlines the process so you know exactly
            what to expect.
          </p>
        </div>

        <Separator />

        {/* Methodology Overview */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">How the Diagnostic Works</h2>
              <p className="text-sm text-muted-foreground">
                A structured approach rooted in systems thinking
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Constraint Thinking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/80">
                Every system has one constraint that limits its output. We find it —
                then everything else becomes clear. Instead of fixing symptoms, we
                trace problems to their root cause.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  SIPOC Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/80">
                We map Suppliers, Inputs, Process steps, Outputs, and Customers for
                each workflow. This creates a shared, high-level view before diving
                into detail.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Workflow Mapping
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/80">
                We capture real workflow paths including handoffs between teams,
                waiting queues, decision points, and rework loops. This is where
                hidden delays and constraints surface.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Flow Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-foreground/80">
                We measure what matters: WIP, throughput, lead time, rework rate,
                and billing cycle. These create a quantitative "before" snapshot and
                reveal exactly where flow breaks down.
              </CardContent>
            </Card>
          </div>

          {isConsultant && (
            <Collapsible open={showConsultantTips} onOpenChange={setShowConsultantTips}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Consultant Note
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showConsultantTips ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/80">
                  <p className="mb-1 font-medium text-primary">Framing the diagnostic</p>
                  Position this as a collaborative discovery process, not an audit. The
                  client should feel like a partner, not a subject. Emphasise that the
                  diagnostic produces evidence-based recommendations — it's about finding
                  leverage points, not assigning blame.
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </section>

        <Separator />

        {/* Phase Timeline */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Phase-by-Phase Timeline</h2>
              <p className="text-sm text-muted-foreground">
                Eight phases across 10 days — each builds on the last
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {phases.map((phase, index) => (
              <Collapsible key={phase.title}>
                <Card className="border-border/60 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </div>
                      <phase.icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{phase.title}</p>
                        <p className="text-xs text-muted-foreground">{phase.duration}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Purpose
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {phase.purpose}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Your Role
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {phase.clientRole}
                        </p>
                      </div>
                      {isConsultant && (
                        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                            <Lightbulb className="h-3 w-3" />
                            Consultant Playbook
                          </p>
                          <p className="text-sm leading-relaxed text-foreground/80">
                            {phase.consultantTip}
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        <Separator />

        {/* What to Expect / FAQ */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">What to Expect</h2>
              <p className="text-sm text-muted-foreground">
                Common questions about the diagnostic process
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <Collapsible
                key={index}
                open={openFaq === index}
                onOpenChange={(open) => setOpenFaq(open ? index : null)}
              >
                <Card className="border-border/60 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40">
                      <span className="flex-1 text-sm font-medium">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/60 px-4 pb-4 pt-3">
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {item.answer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        {isConsultant && (
          <>
            <Separator />

            {/* Consultant-only overview */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Consultant Quick Reference</h2>
                  <p className="text-sm text-muted-foreground">
                    Key principles for running the diagnostic
                  </p>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="space-y-4 pt-6 text-sm leading-relaxed">
                  <div>
                    <p className="mb-1 font-semibold">Pacing</p>
                    <p className="text-foreground/80">
                      Don't rush phases to stay on schedule. It's better to extend by a
                      day than to skip depth. The readout date can flex — the quality of
                      the baseline cannot.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Client Communication</p>
                    <p className="text-foreground/80">
                      Send brief daily updates via email. Share what was completed, what's
                      next, and any blockers. Transparency builds trust and keeps
                      stakeholders engaged.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Data Quality</p>
                    <p className="text-foreground/80">
                      Mark confidence levels on all baseline metrics. A "low confidence"
                      estimate is still more useful than no data. Flag gaps for the readout
                      — they often indicate areas where measurement itself is the first
                      improvement.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Constraint Identification</p>
                    <p className="text-foreground/80">
                      By Phase 5, you should have a working hypothesis for the system
                      constraint. Phases 6–8 either confirm or redirect it. If the
                      constraint shifts during mapping, that's a discovery — not a failure.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <Button size="lg" onClick={handleContinue} className="gap-2 px-8">
            Continue to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            You can revisit this page anytime from the sidebar.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
