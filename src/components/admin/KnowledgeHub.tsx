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
import { Separator } from "@/components/ui/separator";
import {
  Database,
  Cpu,
  Wrench,
  Shield,
  Puzzle,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  CalendarDays,
  Layers,
} from "lucide-react";

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const CATEGORY_ORDER: KnowledgeCategory[] = [
  "Diagnostic Step",
  "AI Engine",
  "Add-On Module",
  "Tool",
  "Admin",
];

const CATEGORY_META: Record<KnowledgeCategory, { icon: React.ReactNode; color: string }> = {
  "Diagnostic Step": { icon: <Database className="h-4 w-4" />, color: "text-primary" },
  "AI Engine": { icon: <Cpu className="h-4 w-4" />, color: "text-primary" },
  "Add-On Module": { icon: <Puzzle className="h-4 w-4" />, color: "text-primary" },
  Tool: { icon: <Wrench className="h-4 w-4" />, color: "text-muted-foreground" },
  Admin: { icon: <Shield className="h-4 w-4" />, color: "text-muted-foreground" },
};

const DATA_SOURCE_BADGE_VARIANT: Record<DataSource["type"], "default" | "secondary" | "outline" | "destructive"> = {
  database_table: "default",
  edge_function: "secondary",
  external_api: "destructive",
  local_calculation: "outline",
  context: "outline",
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function freshnessLabel(iso: string) {
  const d = daysSince(iso);
  if (d <= 30) return { label: "Current", className: "bg-primary/10 text-primary border-primary/20" };
  if (d <= 90) return { label: `${d}d ago`, className: "bg-accent text-foreground border-border" };
  return { label: `${d}d ago`, className: "bg-destructive/10 text-destructive border-destructive/20" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ─── Data Sources Table ────────────────────────────────────────────────────── */

function DataSourcesTable({ sources }: { sources: DataSource[] }) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[140px] text-xs uppercase tracking-wider font-semibold">Type</TableHead>
            <TableHead className="w-[220px] text-xs uppercase tracking-wider font-semibold">Name</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Purpose</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((s, i) => (
            <TableRow key={i} className="hover:bg-muted/20">
              <TableCell>
                <Badge variant={DATA_SOURCE_BADGE_VARIANT[s.type]} className="text-[10px] font-mono uppercase tracking-wide">
                  {s.type.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-foreground">{s.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{s.purpose}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Entry Card ────────────────────────────────────────────────────────────── */

function EntryCard({ entry }: { entry: KnowledgeEntry }) {
  const freshness = freshnessLabel(entry.lastUpdated);

  return (
    <AccordionItem value={entry.id} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="text-left px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">{entry.moduleName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${freshness.className}`}>
              {freshness.label}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-5 pb-5 space-y-5">
          {/* Overview */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overview</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{entry.description}</p>
          </section>

          <Separator />

          {/* How it works */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How It Works</h4>
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: entry.howItWorks.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>') }}
            />
          </section>

          {/* Calculation methodology */}
          {entry.calculationMethodology && (
            <>
              <Separator />
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Calculation Methodology</h4>
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line font-mono bg-muted/30 border border-border rounded-md p-4">
                  {entry.calculationMethodology}
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Data sources */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Data Sources</h4>
            <DataSourcesTable sources={entry.dataSources} />
          </section>

          {/* Limitations */}
          {entry.limitations && (
            <>
              <Separator />
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Limitations</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{entry.limitations}</p>
              </section>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span className="font-mono">Last updated {formatDate(entry.lastUpdated)}</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ─── Freshness Dashboard ───────────────────────────────────────────────────── */

function FreshnessDashboard() {
  const sorted = [...knowledgeHubEntries].sort(
    (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
  );

  const stale = sorted.filter((e) => daysSince(e.lastUpdated) > 90);
  const aging = sorted.filter((e) => { const d = daysSince(e.lastUpdated); return d > 30 && d <= 90; });
  const fresh = sorted.filter((e) => daysSince(e.lastUpdated) <= 30);
  const needsReview = sorted.slice(0, 3);

  const stats = [
    { count: fresh.length, label: "Current", sub: "< 30 days", icon: <CheckCircle className="h-4 w-4" />, accent: "text-primary", bg: "bg-primary/5 border-primary/15" },
    { count: aging.length, label: "Aging", sub: "30–90 days", icon: <Clock className="h-4 w-4" />, accent: "text-warning", bg: "bg-warning/5 border-warning/15" },
    { count: stale.length, label: "Stale", sub: "> 90 days", icon: <AlertTriangle className="h-4 w-4" />, accent: "text-destructive", bg: "bg-destructive/5 border-destructive/15" },
  ];

  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documentation Freshness</h3>
          <span className="text-xs font-mono text-muted-foreground ml-auto">{knowledgeHubEntries.length} modules</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg border p-3 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={s.accent}>{s.icon}</span>
                <span className={`text-2xl font-bold font-mono ${s.accent}`}>{s.count}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {needsReview.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Needs Review First
            </p>
            <div className="space-y-1.5">
              {needsReview.map((e) => {
                const d = daysSince(e.lastUpdated);
                return (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{e.moduleName}</span>
                    <span className={`font-mono ${d > 90 ? "text-destructive" : "text-muted-foreground"}`}>
                      {d}d ago
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function KnowledgeHub() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | null>(null);

  const filtered = useMemo(() => {
    let results = knowledgeHubEntries;

    if (activeCategory) {
      results = results.filter((e) => e.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.moduleName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.howItWorks.toLowerCase().includes(q) ||
          e.dataSources.some((ds) => ds.name.toLowerCase().includes(q))
      );
    }

    return results;
  }, [search, activeCategory]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    entries: filtered.filter((e) => e.category === cat),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Knowledge Hub</h2>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Internal reference for how every Clario module works — calculations, data sources, and AI architectures.
            Update{" "}
            <code className="bg-muted text-foreground/70 px-1.5 py-0.5 rounded text-[11px] font-mono">
              knowledgeHub.ts
            </code>{" "}
            when features change.
          </p>
        </div>
      </div>

      {/* Freshness Dashboard */}
      <FreshnessDashboard />

      {/* Search + Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules, data sources, calculations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === null
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const count = knowledgeHubEntries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {cat}
                <span className="font-mono text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No modules match "<span className="font-medium text-foreground">{search}</span>"
          </p>
        </div>
      )}

      {/* Category Groups */}
      {grouped.map((group) => (
        <div key={group.category}>
          <div className="flex items-center gap-2 mb-2">
            <span className={group.meta.color}>{group.meta.icon}</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.category}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {group.entries.length}
            </span>
          </div>

          <Card className="border-border shadow-none overflow-hidden">
            <Accordion type="multiple">
              {group.entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </Accordion>
          </Card>
        </div>
      ))}
    </div>
  );
}
