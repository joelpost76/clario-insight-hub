import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSidebar } from "@/components/ui/sidebar";

export function WorkspaceSwitcher() {
  const { workspace, availableWorkspaces, switchWorkspace } = useWorkspace();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!availableWorkspaces || availableWorkspaces.length === 0) {
    return null;
  }

  // Get account name for current workspace
  const currentWorkspaceName = workspace?.account_name || "Select Workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 px-2",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate flex-1 text-left">{currentWorkspaceName}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-popover border border-border shadow-lg z-50" 
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableWorkspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                workspace?.id === ws.id ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="flex flex-col">
              <span className="font-medium">{ws.account_name || "Unnamed"}</span>
              <span className="text-xs text-muted-foreground">{ws.type}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
