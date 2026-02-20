import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number | undefined;
  subtext?: string;
  icon?: React.ReactNode;
  highlight?: "neutral" | "caution" | "good";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  highlight = "neutral",
  className,
}: MetricCardProps) {
  const highlightClass = {
    neutral: "",
    caution: "border-l-4 border-l-amber-500",
    good: "border-l-4 border-l-emerald-500",
  }[highlight];

  return (
    <Card className={cn("bg-card", highlightClass, className)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-semibold text-foreground leading-none">
              {value !== undefined && value !== null && value !== 0 ? value : "—"}
            </p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{subtext}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground/60 shrink-0 mt-0.5">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
