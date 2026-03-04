import { cn } from "@/lib/utils";
import { ArrowRight, Users, PackageOpen, Cog, PackageCheck, UserCheck } from "lucide-react";

interface SIPOCFlowDiagramProps {
  /** Which column index (0–4) is currently active/highlighted, or -1 for none */
  activeColumn?: number;
  /** Live items for each column to show populated state */
  data?: {
    suppliers?: string[];
    inputs?: string[];
    process_steps?: string[];
    outputs?: string[];
    customers?: string[];
  };
}

const columns = [
  {
    key: "suppliers",
    label: "Suppliers",
    icon: Users,
    description: "Who provides work or information into this process?",
    examples: "Sales, Client, Vendor, Subcontractor",
    color: "#e8e4dc",
    textColor: "#1A2018",
  },
  {
    key: "inputs",
    label: "Inputs",
    icon: PackageOpen,
    description: "What materials, data, or decisions are needed to start?",
    examples: "Scope, drawings, budget, selections",
    color: "#e8e4dc",
    textColor: "#1A2018",
  },
  {
    key: "process_steps",
    label: "Process",
    icon: Cog,
    description: "What are the key steps that transform inputs into outputs?",
    examples: "Schedule, execute, QC, approve",
    color: "#6b7c3f",
    textColor: "#ffffff",
  },
  {
    key: "outputs",
    label: "Outputs",
    icon: PackageCheck,
    description: "What does this process produce or deliver?",
    examples: "Completed work, invoice, closeout",
    color: "#e8e4dc",
    textColor: "#1A2018",
  },
  {
    key: "customers",
    label: "Customers",
    icon: UserCheck,
    description: "Who receives and depends on the output?",
    examples: "Client, finance, ops, warranty",
    color: "#e8e4dc",
    textColor: "#1A2018",
  },
];

export function SIPOCFlowDiagram({ activeColumn = -1, data }: SIPOCFlowDiagramProps) {
  const getItems = (key: string): string[] => {
    if (!data) return [];
    return (data as Record<string, string[] | undefined>)[key] ?? [];
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3">
        <p className="text-xs text-foreground/80 tracking-wide uppercase font-semibold">
          How SIPOC maps your workflow
        </p>
      </div>

      {/* Flow diagram */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {columns.map((col, i) => {
          const Icon = col.icon;
          const isActive = i === activeColumn;
          const items = getItems(col.key);
          const hasItems = items.length > 0;
          const isProcess = col.key === "process_steps";

          return (
            <div key={col.key} className="flex items-stretch">
              <div
                className={cn(
                  "relative flex flex-col items-center rounded-xl border px-3 py-4 min-w-[130px] max-w-[160px] flex-1 transition-all duration-500",
                  isActive
                    ? "border-primary shadow-md shadow-primary/10 scale-[1.03] bg-primary/5"
                    : hasItems
                    ? "border-border bg-card"
                    : "border-dashed border-border/60 bg-muted/30"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isProcess
                      ? "bg-[#6b7c3f]/15 text-[#6b7c3f]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider mb-1 transition-colors duration-300",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  {col.label}
                </span>

                {/* Description */}
                <p className="text-[11px] text-foreground/70 text-center leading-tight mb-2">
                  {col.description}
                </p>

                {/* Items or examples */}
                <div className="flex-1 flex flex-col justify-end w-full">
                  {hasItems ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {items.slice(0, 4).map((item, j) => (
                        <span
                          key={j}
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4"
                          style={{
                            backgroundColor: col.color,
                            color: col.textColor,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                      {items.length > 4 && (
                        <span className="text-[11px] text-foreground/60">
                          +{items.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-foreground/40 text-center italic">
                      {col.examples}
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              {i < columns.length - 1 && (
                <div className="flex items-center px-1 shrink-0">
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 transition-colors duration-300",
                      i === activeColumn || i + 1 === activeColumn
                        ? "text-primary"
                        : "text-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom insight */}
      <div className="mt-3 px-1">
        <p className="text-xs text-foreground/70 leading-relaxed">
          <span className="font-semibold text-foreground">Clario uses this map</span> to trace where
          work waits, where inputs are missing, and which handoffs create rework — revealing the
          constraint that throttles your throughput.
        </p>
      </div>
    </div>
  );
}
