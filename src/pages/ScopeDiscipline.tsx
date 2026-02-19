import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitPullRequest } from "lucide-react";
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

export default function ScopeDiscipline() {
  const [responses, setResponses] = useState<ScopeDisciplineResponses>(EMPTY);

  const set = (key: keyof ScopeDisciplineResponses) => (value: string) =>
    setResponses((prev) => ({ ...prev, [key]: value }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GitPullRequest className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scope &amp; Change Discipline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Assess how estimate accuracy, change order capture, and scope control are managed across projects.
            </p>
          </div>
        </div>

        {/* Section 1 — Estimating */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimating Practices</CardTitle>
            <CardDescription>How estimates are built, owned, and reviewed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="estimateVarianceFrequency">
                How often do final costs exceed original estimates?
              </Label>
              <Select
                value={responses.estimateVarianceFrequency}
                onValueChange={set("estimateVarianceFrequency")}
              >
                <SelectTrigger id="estimateVarianceFrequency">
                  <SelectValue placeholder="Select frequency…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely — most jobs come in on estimate</SelectItem>
                  <SelectItem value="sometimes">Sometimes — noticeable but not the norm</SelectItem>
                  <SelectItem value="often">Often — more than half of jobs run over</SelectItem>
                  <SelectItem value="almost_always">Almost always — overruns are expected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimateReviewProcess">
                Describe your estimate review process before a job is quoted.
              </Label>
              <Textarea
                id="estimateReviewProcess"
                placeholder="e.g. PM reviews scope, estimator signs off, no formal review…"
                value={responses.estimateReviewProcess}
                onChange={(e) => set("estimateReviewProcess")(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatingOwnership">
                Who owns the estimating function — and is there a defined standard method?
              </Label>
              <Textarea
                id="estimatingOwnership"
                placeholder="e.g. Estimator role, ad-hoc by PM, shared across team…"
                value={responses.estimatingOwnership}
                onChange={(e) => set("estimatingOwnership")(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Change Order Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Order Approval &amp; Thresholds</CardTitle>
            <CardDescription>How change orders move from field to client signature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="avgChangeApprovalTime">
                On average, how long does it take for a change order to go from field identification to client approval?
              </Label>
              <Select
                value={responses.avgChangeApprovalTime}
                onValueChange={set("avgChangeApprovalTime")}
              >
                <SelectTrigger id="avgChangeApprovalTime">
                  <SelectValue placeholder="Select timeframe…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_day">Same day</SelectItem>
                  <SelectItem value="1_3_days">1–3 days</SelectItem>
                  <SelectItem value="4_7_days">4–7 days</SelectItem>
                  <SelectItem value="over_a_week">Over a week</SelectItem>
                  <SelectItem value="no_process">No defined process</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pmApprovalThreshold">
                What is the dollar threshold below which a PM can approve a change without escalation?
              </Label>
              <Select
                value={responses.pmApprovalThreshold}
                onValueChange={set("pmApprovalThreshold")}
              >
                <SelectTrigger id="pmApprovalThreshold">
                  <SelectValue placeholder="Select threshold…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_threshold">No defined threshold</SelectItem>
                  <SelectItem value="under_500">Under $500</SelectItem>
                  <SelectItem value="500_2000">$500–$2,000</SelectItem>
                  <SelectItem value="2000_5000">$2,000–$5,000</SelectItem>
                  <SelectItem value="over_5000">Over $5,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workBeforePricing">
                How often does change work begin before pricing and schedule impact are confirmed with the client?
              </Label>
              <Select
                value={responses.workBeforePricing}
                onValueChange={set("workBeforePricing")}
              >
                <SelectTrigger id="workBeforePricing">
                  <SelectValue placeholder="Select frequency…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely — we wait for sign-off</SelectItem>
                  <SelectItem value="sometimes">Sometimes — on smaller changes we proceed</SelectItem>
                  <SelectItem value="often">Often — field pressure drives execution first</SelectItem>
                  <SelectItem value="almost_always">Almost always — pricing follows the work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Margin Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Margin Visibility &amp; Tracking</CardTitle>
            <CardDescription>How well the business sees margin impact from scope changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="marginErosionVisibility">
                How visible is margin erosion from scope changes during a project — not just at job close?
              </Label>
              <Select
                value={responses.marginErosionVisibility}
                onValueChange={set("marginErosionVisibility")}
              >
                <SelectTrigger id="marginErosionVisibility">
                  <SelectValue placeholder="Select visibility level…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real_time">Real-time — we track it actively</SelectItem>
                  <SelectItem value="periodic">Periodic — reviewed weekly or monthly</SelectItem>
                  <SelectItem value="at_close">Only at job close</SelectItem>
                  <SelectItem value="not_tracked">Not formally tracked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="changeOrderMarginTracking">
                Are change orders tracked separately for margin contribution — or rolled into the base job cost?
              </Label>
              <Select
                value={responses.changeOrderMarginTracking}
                onValueChange={set("changeOrderMarginTracking")}
              >
                <SelectTrigger id="changeOrderMarginTracking">
                  <SelectValue placeholder="Select tracking method…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tracked_separately">Tracked separately with own margin line</SelectItem>
                  <SelectItem value="rolled_in">Rolled into base job — not separated</SelectItem>
                  <SelectItem value="inconsistent">Inconsistent — depends on the PM</SelectItem>
                  <SelectItem value="not_tracked">Not tracked at all</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 — Field Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field Behavior &amp; Client Conversations</CardTitle>
            <CardDescription>How scope changes are identified and communicated at the point of work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="smallChangeLoggingBehavior">
                How are small, informal scope additions handled in the field? Are they logged, or absorbed?
              </Label>
              <Textarea
                id="smallChangeLoggingBehavior"
                placeholder="e.g. Crew absorbs minor adds, PM logs anything over $200, varies by foreman…"
                value={responses.smallChangeLoggingBehavior}
                onChange={(e) => set("smallChangeLoggingBehavior")(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="changeConversationStructure">
                Describe how PMs or field staff typically raise scope changes with clients — scripted, ad-hoc, or avoided?
              </Label>
              <Textarea
                id="changeConversationStructure"
                placeholder="e.g. PM calls client directly, we use a standard form, conversations are often avoided…"
                value={responses.changeConversationStructure}
                onChange={(e) => set("changeConversationStructure")(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Analysis and scoring for this module are coming soon.
        </p>
      </div>
    </AppLayout>
  );
}
