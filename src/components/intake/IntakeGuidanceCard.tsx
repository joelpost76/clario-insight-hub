import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface IntakeGuidanceCardProps {
  title: string;
  children: ReactNode;
}

export function IntakeGuidanceCard({ title, children }: IntakeGuidanceCardProps) {
  return (
    <Card className="border-secondary bg-accent">
      <CardContent className="py-4">
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </CardContent>
    </Card>
  );
}
