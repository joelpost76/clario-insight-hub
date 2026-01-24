import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function CreateFirstWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useWorkspace();
  const [companyName, setCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to create a workspace.",
        variant: "destructive",
      });
      return;
    }

    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter your company or project name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create the account
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({ name: companyName.trim() })
        .select("id")
        .single();

      if (accountError) throw accountError;

      // 2. Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          account_id: account.id,
          type: "clario_diagnostic",
          status: "active",
        })
        .select("id")
        .single();

      if (workspaceError) throw workspaceError;

      // 3. Add current user as workspace member
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast({
        title: "Workspace created!",
        description: `"${companyName}" is ready. Redirecting to your dashboard...`,
      });

      // Small delay so the toast is visible, then force a full reload to re-hydrate context
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({
        title: "Failed to create workspace",
        description: message,
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">Create Your First Workspace</CardTitle>
        <CardDescription>
          Set up an account and workspace to start using Clario™ Diagnostic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company / Project Name</Label>
          <Input
            id="company-name"
            placeholder="e.g. Acme Corp"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={isCreating || !companyName.trim()}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Workspace"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
