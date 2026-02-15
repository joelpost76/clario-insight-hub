import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowLeft, RefreshCw, Eye, ChevronUp, ChevronDown, Megaphone, FolderPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface SalesLead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_title: string | null;
  industry: string | null;
  revenue_range: string | null;
  headcount: number | null;
  services_selected: any;
  total_estimated_investment: any;
  pain_points: string[];
  urgency: string;
  status: string;
  referral_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "qualified", label: "Qualified", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "workspace_created", label: "Workspace Created", color: "bg-purple-100 text-purple-800 border-purple-200" },
];

const URGENCY_LABELS: Record<string, string> = {
  immediate: "Immediate",
  "1-3_months": "1–3 months",
  "3-6_months": "3–6 months",
  exploring: "Exploring",
};

const REVENUE_LABELS: Record<string, string> = {
  under_1m: "< $1M",
  "1m-5m": "$1M–$5M",
  "5m-10m": "$5M–$10M",
  "10m-25m": "$10M–$25M",
  "25m_plus": "$25M+",
};

const PAIN_LABELS: Record<string, string> = {
  recurring_fires: "Recurring fires / reactive mode",
  unclear_root_causes: "Unclear root causes",
  work_waits: "Work waits / bottlenecks",
  rework: "Rework / repeated effort",
  decisions_bottleneck: "Decisions bottleneck",
  schedule_unpredictability: "Schedule unpredictability",
  billing_delays: "Billing delays / cash flow",
  team_burnout: "Team burnout / turnover",
  tool_sprawl: "Tool sprawl / system mismatch",
  unclear_roles: "Unclear roles / accountability",
  slow_onboarding: "Slow onboarding / knowledge gaps",
  client_communication: "Client communication issues",
};

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return (
    <Badge variant="outline" className={opt?.color ?? ""}>
      {opt?.label ?? status}
    </Badge>
  );
}

export default function AdminLeads() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortField, setSortField] = useState<"created_at" | "company_name" | "urgency">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [statusChangeTarget, setStatusChangeTarget] = useState<{ lead: SalesLead; newStatus: string } | null>(null);
  const [createWsTarget, setCreateWsTarget] = useState<SalesLead | null>(null);
  const [creatingWs, setCreatingWs] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching leads", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as SalesLead[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const updateData: Record<string, any> = { status: newStatus };
    if (newStatus === "qualified") updateData.qualified_at = new Date().toISOString();
    if (newStatus === "accepted") updateData.accepted_at = new Date().toISOString();

    const { error } = await supabase.from("sales_leads").update(updateData).eq("id", leadId);

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    }
    setStatusChangeTarget(null);
  };

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (urgencyFilter !== "all") result = result.filter((l) => l.urgency === urgencyFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.company_name.toLowerCase().includes(q) ||
          l.contact_name.toLowerCase().includes(q) ||
          l.contact_email.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === "company_name") cmp = a.company_name.localeCompare(b.company_name);
      else if (sortField === "urgency") {
        const order = ["immediate", "1-3_months", "3-6_months", "exploring"];
        cmp = order.indexOf(a.urgency) - order.indexOf(b.urgency);
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [leads, statusFilter, urgencyFilter, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null;

  const getSelectedServices = (services: any) => {
    if (!Array.isArray(services)) return [];
    return services.filter((s: any) => s.selected).map((s: any) => s.name);
  };

  const formatInvestment = (inv: any) => {
    if (!inv) return "—";
    return `$${(inv.min ?? 0).toLocaleString()} – $${(inv.max ?? 0).toLocaleString()}`;
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, [leads]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Megaphone className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Sales Leads</h1>
              <p className="text-sm text-muted-foreground">{leads.length} total leads</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map((s) => (
            <Card
              key={s.value}
              className={`cursor-pointer transition-shadow hover:shadow-md ${statusFilter === s.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{statusCounts[s.value] || 0}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search company, name, or email…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgencies</SelectItem>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="1-3_months">1–3 months</SelectItem>
              <SelectItem value="3-6_months">3–6 months</SelectItem>
              <SelectItem value="exploring">Exploring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("company_name")}>
                    <span className="flex items-center gap-1">Company <SortIcon field="company_name" /></span>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("urgency")}>
                    <span className="flex items-center gap-1">Urgency <SortIcon field="urgency" /></span>
                  </TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                    <span className="flex items-center gap-1">Submitted <SortIcon field="created_at" /></span>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {loading ? "Loading…" : "No leads found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.company_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{lead.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{lead.contact_email}</div>
                      </TableCell>
                      <TableCell>{URGENCY_LABELS[lead.urgency] ?? lead.urgency}</TableCell>
                      <TableCell className="text-sm">{formatInvestment(lead.total_estimated_investment)}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => setStatusChangeTarget({ lead, newStatus: val })}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs border-none shadow-none p-0">
                            <StatusBadge status={lead.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedLead.company_name}
                  <StatusBadge status={selectedLead.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Contact */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Contact</h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span>{selectedLead.contact_name}</span>
                    {selectedLead.contact_title && (
                      <><span className="text-muted-foreground">Title</span><span>{selectedLead.contact_title}</span></>
                    )}
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${selectedLead.contact_email}`} className="text-primary underline">{selectedLead.contact_email}</a>
                    {selectedLead.contact_phone && (
                      <><span className="text-muted-foreground">Phone</span><span>{selectedLead.contact_phone}</span></>
                    )}
                  </div>
                </section>

                {/* Company */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Company</h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    {selectedLead.industry && (
                      <><span className="text-muted-foreground">Industry</span><span className="capitalize">{selectedLead.industry.replace(/_/g, " ")}</span></>
                    )}
                    {selectedLead.revenue_range && (
                      <><span className="text-muted-foreground">Revenue</span><span>{REVENUE_LABELS[selectedLead.revenue_range] ?? selectedLead.revenue_range}</span></>
                    )}
                    {selectedLead.headcount && (
                      <><span className="text-muted-foreground">Headcount</span><span>{selectedLead.headcount}</span></>
                    )}
                  </div>
                </section>

                {/* Services */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Selected Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedServices(selectedLead.services_selected).map((name: string) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Investment: </span>
                    <span className="font-medium">{formatInvestment(selectedLead.total_estimated_investment)}</span>
                  </p>
                </section>

                {/* Pain points */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Pain Points</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.pain_points.map((pp) => (
                      <Badge key={pp} variant="outline">{PAIN_LABELS[pp] ?? pp}</Badge>
                    ))}
                  </div>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Urgency: </span>
                    <span className="font-medium">{URGENCY_LABELS[selectedLead.urgency] ?? selectedLead.urgency}</span>
                  </p>
                </section>

                {/* Notes & referral */}
                {(selectedLead.notes || selectedLead.referral_source) && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Additional</h3>
                    {selectedLead.referral_source && (
                      <p className="text-sm"><span className="text-muted-foreground">Referral: </span>{selectedLead.referral_source}</p>
                    )}
                    {selectedLead.notes && (
                      <p className="text-sm mt-1"><span className="text-muted-foreground">Notes: </span>{selectedLead.notes}</p>
                    )}
                  </section>
                )}

                {/* Create workspace action */}
                {selectedLead.status !== "workspace_created" && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Onboard Client</h3>
                    <Button
                      onClick={() => setCreateWsTarget(selectedLead)}
                      className="gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create Workspace from Lead
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creates an account &amp; workspace from this lead's company data.
                    </p>
                  </section>
                )}

                {/* Status change */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.filter((s) => s.value !== selectedLead.status).map((s) => (
                      <Button
                        key={s.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusChangeTarget({ lead: selectedLead, newStatus: s.value })}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </section>

                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(selectedLead.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status change confirmation */}
      <AlertDialog open={!!statusChangeTarget} onOpenChange={(open) => !open && setStatusChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change lead status?</AlertDialogTitle>
            <AlertDialogDescription>
              Change <strong>{statusChangeTarget?.lead.company_name}</strong> from{" "}
              <StatusBadge status={statusChangeTarget?.lead.status ?? ""} /> to{" "}
              <StatusBadge status={statusChangeTarget?.newStatus ?? ""} />?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                statusChangeTarget && handleStatusChange(statusChangeTarget.lead.id, statusChangeTarget.newStatus)
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create workspace confirmation */}
      <AlertDialog open={!!createWsTarget} onOpenChange={(open) => !open && setCreateWsTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create workspace from lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new account and Clario™ Diagnostic workspace for{" "}
              <strong>{createWsTarget?.company_name}</strong> and update the lead status to "Workspace Created".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingWs}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={creatingWs}
              onClick={async (e) => {
                e.preventDefault();
                if (!createWsTarget) return;
                setCreatingWs(true);
                try {
                  const { data, error } = await supabase.functions.invoke("create-workspace-from-lead", {
                    body: { lead_id: createWsTarget.id },
                  });
                  if (error) throw error;
                  if (data?.error) throw new Error(data.error);
                  toast({
                    title: "Workspace created!",
                    description: `Account and workspace created for ${data.company_name}.`,
                  });
                  setCreateWsTarget(null);
                  setDetailOpen(false);
                  fetchLeads();
                } catch (err: any) {
                  toast({ title: "Failed to create workspace", description: err.message, variant: "destructive" });
                } finally {
                  setCreatingWs(false);
                }
              }}
            >
              {creatingWs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
