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
import { Plus, Trash2, FileText, Loader2, ExternalLink } from "lucide-react";
import { Artifact } from "@/types/database";

const ARTIFACT_TYPES = [
  { value: "estimate", label: "Estimate" },
  { value: "job_packet", label: "Job Packet" },
  { value: "schedule", label: "Schedule" },
  { value: "billing", label: "Billing" },
  { value: "change_order_log", label: "Change Order Log" },
  { value: "job_costing", label: "Job Costing" },
  { value: "ar_aging", label: "A/R Aging" },
  { value: "kpi_report", label: "KPI Report" },
  { value: "sop", label: "SOP" },
  { value: "template", label: "Template" },
  { value: "other", label: "Other" },
];

export default function Artifacts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    link_or_file: "",
    tags: "",
    notes: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadArtifacts();
    }
  }, [workspaceId]);

  const loadArtifacts = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("artifacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (data) {
      setArtifacts(data as unknown as Artifact[]);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.type || !formData.link_or_file.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please select a type and provide a link or file.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("artifacts")
      .insert({
        workspace_id: workspaceId,
        type: formData.type,
        title: formData.title || null,
        link_or_file: formData.link_or_file,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
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
        title: "Artifact added",
        description: `"${formData.title || formData.type}" has been added.`,
      });
      setArtifacts((prev) => [data as unknown as Artifact, ...prev]);
      setFormData({ type: "", title: "", link_or_file: "", tags: "", notes: "" });
      setShowForm(false);
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("artifacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: "Artifact removed",
        description: "The artifact has been removed.",
      });
      await refreshCompletionStatus();
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
            <h1 className="text-2xl font-semibold tracking-tight">Artifacts</h1>
            <p className="mt-1 text-muted-foreground">
              Upload or link key artifacts. We don't need perfection — we need reality.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Artifact
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New Artifact</CardTitle>
              <CardDescription>
                What we need: Documents that show how work flows today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Artifact type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTIFACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Weekly PM Report"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_or_file">Link or file URL *</Label>
                <Input
                  id="link_or_file"
                  placeholder="https://drive.google.com/... or paste file link"
                  value={formData.link_or_file}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link_or_file: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="handoff, billing, scheduling, rework"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="What does this artifact show? Why is it relevant?"
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
                  Add Artifact
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Artifact List</CardTitle>
            <CardDescription>
              {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""} collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No artifacts yet. Add process documents, reports, or data sources.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artifacts.map((artifact) => (
                    <TableRow key={artifact.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {ARTIFACT_TYPES.find((t) => t.value === artifact.type)?.label || artifact.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{artifact.title || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {artifact.tags?.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={artifact.link_or_file} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(artifact.id)}
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
          <Button variant="secondary" onClick={() => navigate("/interviews")}>
            Next: Interviews
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
