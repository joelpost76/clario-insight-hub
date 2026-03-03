import { useState, useMemo } from "react";
import { knowledgeHubEntries, type KnowledgeCategory, type KnowledgeEntry, type DataSource } from "@/data/knowledgeHub";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Database, Cpu, Wrench, Shield, Puzzle, Search, Clock, AlertTriangle, CheckCircle } from "lucide-react";

const CATEGORY_ORDER: KnowledgeCategory[] = [
  "Diagnostic Step",
  "AI Engine",
  "Add-On Module",
  "Tool",
  "Admin",
];

const CATEGORY_ICONS: Record<KnowledgeCategory, React.ReactNode> = {
  "Diagnostic Step": <Database className="h-4 w-4" />,
  "AI Engine": <Cpu className="h-4 w-4" />,
  "Add-On Module": <Puzzle className="h-4 w-4" />,
  Tool: <Wrench className="h-4 w-4" />,
  Admin: <Shield className="h-4 w-4" />,
};

const DATA_SOURCE_BADGE_VARIANT: Record<DataSource["type"], "default" | "secondary" | "outline" | "destructive"> = {
  database_table: "default",
  edge_function: "secondary",
  external_api: "destructive",
  local_calculation: "outline",
  context: "outline",
};

function DataSourcesTable({ sources }: { sources: DataSource[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">Type</TableHead>
          <TableHead className="w-[220px]">Name</TableHead>
          <TableHead>Purpose</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((s, i) => (
          <TableRow key={i}>
            <TableCell>
              <Badge variant={DATA_SOURCE_BADGE_VARIANT[s.type]} className="text-xs font-mono">
                {s.type.replace(/_/g, " ")}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{s.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{s.purpose}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EntryCard({ entry }: { entry: KnowledgeEntry }) {
  return (
    <AccordionItem value={entry.id}>
      <AccordionTrigger className="text-left">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{entry.moduleName}</span>
          <Badge variant="outline" className="text-xs">
            {entry.category}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 pl-1">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Overview</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
          </div>

          {/* How it works */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">How It Works</h4>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {entry.howItWorks}
            </div>
          </div>

          {/* Calculation methodology */}
          {entry.calculationMethodology && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Calculation Methodology</h4>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-mono bg-muted/50 rounded-md p-3">
                {entry.calculationMethodology}
              </div>
            </div>
          )}

          {/* Data sources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Data Sources</h4>
            <DataSourcesTable sources={entry.dataSources} />
          </div>

          {/* Limitations */}
          {entry.limitations && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Limitations</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{entry.limitations}</p>
            </div>
          )}

          {/* Last updated */}
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(entry.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function LastUpdatedDashboard() {
  const now = new Date();
  const sorted = [...knowledgeHubEntries].sort(
    (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
  );

  const daysSince = (iso: string) => Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);

  const stale = sorted.filter((e) => daysSince(e.lastUpdated) > 90);
  const aging = sorted.filter((e) => { const d = daysSince(e.lastUpdated); return d > 30 && d <= 90; });
  const fresh = sorted.filter((e) => daysSince(e.lastUpdated) <= 30);

  const oldest = sorted.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-foreground">{fresh.length}</p>
            <p className="text-xs text-muted-foreground">Updated &lt; 30 days</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-foreground">{aging.length}</p>
            <p className="text-xs text-muted-foreground">30–90 days old</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stale.length}</p>
            <p className="text-xs text-muted-foreground">Over 90 days — needs review</p>
          </div>
        </CardContent>
      </Card>
      {oldest.length > 0 && (
        <div className="md:col-span-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Oldest entries</p>
          <div className="flex flex-wrap gap-2">
            {oldest.map((e) => (
              <Badge key={e.id} variant={daysSince(e.lastUpdated) > 90 ? "destructive" : "secondary"} className="text-xs">
                {e.moduleName} — {daysSince(e.lastUpdated)}d ago
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeHub() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return knowledgeHubEntries;
    const q = search.toLowerCase();
    return knowledgeHubEntries.filter(
      (e) =>
        e.moduleName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.howItWorks.toLowerCase().includes(q) ||
        e.dataSources.some((ds) => ds.name.toLowerCase().includes(q))
    );
  }, [search]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    icon: CATEGORY_ICONS[cat],
    entries: filtered.filter((e) => e.category === cat),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Knowledge Hub</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Internal documentation for how every section of Clario works, how outcomes are calculated, and what data sources are used.
          This registry is the canonical source of truth — update <code className="bg-muted px-1 rounded text-xs">src/data/knowledgeHub.ts</code> when features change.
        </p>
      </div>

      <LastUpdatedDashboard />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search modules, data sources, calculations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No modules match "{search}"
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.category}>
          <div className="flex items-center gap-2 mb-3">
            {group.icon}
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.category}
            </h3>
            <Badge variant="secondary" className="text-xs">{group.entries.length}</Badge>
          </div>

          <Accordion type="multiple" className="border rounded-lg">
            {group.entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
