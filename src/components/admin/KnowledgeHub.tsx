import { knowledgeHubEntries, type KnowledgeCategory, type KnowledgeEntry, type DataSource } from "@/data/knowledgeHub";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Cpu, Wrench, Shield, Puzzle } from "lucide-react";

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

export default function KnowledgeHub() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    icon: CATEGORY_ICONS[cat],
    entries: knowledgeHubEntries.filter((e) => e.category === cat),
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
