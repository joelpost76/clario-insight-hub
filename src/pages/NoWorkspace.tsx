import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Building2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import unburntLogo from "@/assets/unburnt-clario-logo.png";

export default function NoWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, workspaceId, user, loading } = useWorkspace();

  const isAdmin = userRole === "unburnt_admin";

  // If membership exists (e.g., seeded or just assigned), don't leave the user stuck here.
  useEffect(() => {
    if (!loading && user && workspaceId) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, workspaceId, navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-8">
      <img 
        src={unburntLogo} 
        alt="Unburnt Clario" 
        className="mb-8 h-16 w-auto"
      />
      
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">No Workspace Assigned</CardTitle>
          <CardDescription className="text-base">
            You haven't been added to a Clario™ Diagnostic workspace yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "You're signed in as an admin, but this user isn't assigned to a workspace yet. Use the Admin Dashboard to create a workspace and add yourself as a member."
              : "This user isn't assigned to a workspace yet. Once you're added, you'll be able to participate in the diagnostic process."}
          </p>
          
          {isAdmin && (
            <Button 
              onClick={() => navigate("/admin")}
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Go to Admin Dashboard
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground">
        From smoke to source. Then we build the fix.
      </p>
    </div>
  );
}
