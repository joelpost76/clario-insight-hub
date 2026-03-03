import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation } from "lucide-react";

export default function Readout() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Readout</h1>
          <p className="mt-1 text-muted-foreground">
            Present the diagnostic findings and recommended path forward.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Presentation className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              Readout preparation is coming soon. Complete the Synthesis step first to identify the primary constraint.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => navigate("/synthesis")}>
            Back to Synthesis
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
