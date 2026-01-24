import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { Interview } from "@/types/database";

const ROLE_OPTIONS = [
  "Owner/GM",
  "Ops Lead",
  "Finance/Controller",
  "Project Manager",
  "Scheduler/Coordinator",
  "Sales/Estimator",
  "Field Lead",
  "Admin/Support",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
];

export default function Interviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    interviewee_name: "",
    role: "",
    email: "",
    status: "planned",
    scheduled_at: "",
    themes: "",
    notes: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadInterviews();
    }
  }, [workspaceId]);

  const loadInterviews = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (data) {
      setInterviews(data as unknown as Interview[]);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.interviewee_name.trim() || !formData.role) {
      toast({
        title: "Required fields missing",
        description: "Please enter name and role.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        workspace_id: workspaceId,
        interviewee_name: formData.interviewee_name,
        role: formData.role,
        email: formData.email || null,
        status: formData.status,
        scheduled_at: formData.scheduled_at || null,
        themes: formData.themes ? formData.themes.split(",").map((t) => t.trim()).filter(Boolean) : null,
        notes: formData.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Interview added",
        description: `${formData.interviewee_name} has been added to the roster.`,
      });
      setInterviews((prev) => [data as unknown as Interview, ...prev]);
      setFormData({ interviewee_name: "", role: "", email: "", status: "planned", scheduled_at: "", themes: "", notes: "" });
      setShowForm(false);
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("interviews")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      toast({
        title: "Interview removed",
        description: "The interviewee has been removed.",
      });
      await refreshCompletionStatus();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary">Completed</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Planned</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
            <p className="mt-1 text-muted-foreground">
              This is not a performance review. We're looking for patterns: handoffs, rework loops, queues, missing inputs.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Interviewee
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New Interviewee</CardTitle>
              <CardDescription>
                Who should we talk to? Include people who do the work and people who manage it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.interviewee_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, interviewee_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Scheduled date (optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="date"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="themes">Themes (comma-separated)</Label>
                <Input
                  id="themes"
                  placeholder="handoff, scheduling, billing, rework, tools"
                  value={formData.themes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, themes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any context about this interviewee..."
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Roster
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Interview Roster</CardTitle>
            <CardDescription>
              {interviews.length} interviewee{interviews.length !== 1 ? "s" : ""} listed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No interviewees yet. Add people who can explain how work really flows.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">{interview.interviewee_name}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.role}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.email || "—"}</TableCell>
                      <TableCell>{getStatusBadge(interview.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(interview.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate("/survey")}>
            Next: Team Survey
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
