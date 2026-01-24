import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { workspace, completionStatus } = useWorkspace();

  // Convert completion status to URL-keyed format for sidebar
  const urlCompletionStatus: Record<string, boolean> = {
    "/dashboard": true, // Always "complete" for navigation purposes
    "/kickoff": completionStatus.kickoff,
    "/intake": completionStatus.intake,
    "/artifacts": completionStatus.artifacts,
    "/interviews": completionStatus.interviews,
    "/survey": completionStatus.survey,
    "/sipoc": completionStatus.sipoc,
    "/workflow": completionStatus.workflow,
    "/baseline": completionStatus.baseline,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          completionStatus={urlCompletionStatus} 
          dayNumber={workspace?.day_counter ?? 1} 
        />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
