import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GitPullRequest, Zap } from "lucide-react";
import type { ScopeDisciplineResponses } from "@/types/scopeDisciplineTypes";

const EMPTY: ScopeDisciplineResponses = {
  estimateVarianceFrequency: "",
  estimateReviewProcess: "",
  estimatingOwnership: "",
  avgChangeApprovalTime: "",
  pmApprovalThreshold: "",
  workBeforePricing: "",
  marginErosionVisibility: "",
  changeOrderMarginTracking: "",
  smallChangeLoggingBehavior: "",
  changeConversationStructure: "",
};

interface Field {
  key: keyof ScopeDisciplineResponses;
  label: string;
  placeholder?: string;
}

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "Section 1 — Estimate Integrity",
    fields: [
      {
        key: "estimateVarianceFrequency",
        label: "How often does actual field duration exceed the estimate?",
        placeholder: "Describe frequency and typical magnitude of overruns…",
      },
      {
        key: "estimateReviewProcess",
        label: "Is there a formal estimate-to-actual review?",
        placeholder: "Describe the review process, cadence, and who participates…",
      },
      {
        key: "estimatingOwnership",
        label: "Who owns and updates estimating standards?",
        placeholder: "Name the role or person responsible and how standards are maintained…",
      },
    ],
  },
  {
    title: "Section 2 — Change Order Flow",
    fields: [
      {
        key: "avgChangeApprovalTime",
        label: "Average time from change identification to client approval?",
        placeholder: "e.g. same day, 3–5 days, over a week — and what drives the delay…",
      },
      {
        key: "pmApprovalThreshold",
        label: "Can PMs approve small changes independently?",
        placeholder: "Describe any dollar or scope thresholds and who else is involved…",
      },
      {
        key: "workBeforePricing",
        label: "Does field work ever proceed before pricing is finalized?",
        placeholder: "How often, under what conditions, and who makes that call…",
      },
    ],
  },
  {
    title: "Section 3 — Margin Visibility",
    fields: [
      {
        key: "marginErosionVisibility",
        label: "When do you detect margin erosion — during execution or after close?",
        placeholder: "Describe your current visibility and what triggers awareness…",
      },
      {
        key: "changeOrderMarginTracking",
        label: "Are change orders tracked separately from base margin?",
        placeholder: "Describe how COs are recorded and whether margin is isolated…",
      },
    ],
  },
  {
    title: "Section 4 — Behavioral Signals",
    fields: [
      {
        key: "smallChangeLoggingBehavior",
        label: "Do PMs hesitate to log small scope changes?",
        placeholder: "Describe what typically gets logged vs. absorbed informally…",
      },
      {
        key: "changeConversationStructure",
        label: "Are change conversations structured or reactive?",
        placeholder: "Describe how PMs or field staff typically raise scope changes with clients…",
      },
    ],
  },
];

export default function ScopeDiscipline() {
  const [responses, setResponses] = useState<ScopeDisciplineResponses>(EMPTY);

  const set = (key: keyof ScopeDisciplineResponses) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setResponses((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = () => {
    // Placeholder — AI analysis coming soon
    console.log("Generate Scope Control Plan", responses);
  };

  const filledCount = Object.values(responses).filter((v) => v.trim().length > 0).length;
  const totalFields = Object.keys(EMPTY).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GitPullRequest className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scope &amp; Change Discipline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Assess how estimate accuracy, change order capture, and scope control operate across projects.
              Answer each question to generate a targeted Scope Control Plan.
            </p>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.fields.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium leading-snug">
                    {label}
                  </Label>
                  <Textarea
                    id={key}
                    placeholder={placeholder}
                    value={responses[key]}
                    onChange={set(key)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Generate button */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleGenerate}
            disabled={filledCount < 6}
          >
            <Zap className="h-4 w-4" />
            Generate Scope Control Plan
          </Button>
          {filledCount < 6 && (
            <p className="text-xs text-muted-foreground">
              Complete at least 6 of {totalFields} fields to generate the plan ({filledCount}/{totalFields} filled).
            </p>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
