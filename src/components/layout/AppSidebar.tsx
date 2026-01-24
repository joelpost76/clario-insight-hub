import { useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Rocket, 
  ClipboardList, 
  FileStack, 
  Users, 
  BarChart3, 
  GitBranch,
  Workflow,
  Activity,
  LogOut,
  Check,
  Circle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  complete?: boolean;
}

const diagnosticSteps: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kickoff", url: "/kickoff", icon: Rocket },
  { title: "Intake", url: "/intake", icon: ClipboardList },
  { title: "Artifacts", url: "/artifacts", icon: FileStack },
  { title: "Interviews", url: "/interviews", icon: Users },
  { title: "Team Survey", url: "/survey", icon: BarChart3 },
  { title: "SIPOC", url: "/sipoc", icon: GitBranch },
  { title: "Workflow", url: "/workflow", icon: Workflow },
  { title: "Flow Baseline", url: "/baseline", icon: Activity },
];

interface AppSidebarProps {
  completionStatus?: Record<string, boolean>;
  dayNumber?: number;
}

export function AppSidebar({ completionStatus = {}, dayNumber = 1 }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">U</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Unburnt</span>
              <span className="text-xs text-muted-foreground">Clario Portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {!collapsed && (
          <div className="mx-2 my-4 rounded-md bg-sidebar-accent p-3">
            <p className="text-xs font-medium text-sidebar-foreground">Day {dayNumber} of 10</p>
            <p className="mt-1 text-xs text-muted-foreground">Clario™ Diagnostic</p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Diagnostic Steps
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {diagnosticSteps.map((item) => {
                const isComplete = completionStatus[item.url] || false;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent font-medium text-primary"
                      >
                        <div className="relative">
                          <item.icon className="h-4 w-4" />
                          {isComplete && !collapsed && (
                            <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                              <Check className="h-2 w-2 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        {!collapsed && (
                          <span className="flex-1">{item.title}</span>
                        )}
                        {!collapsed && (
                          <span className={isComplete ? "text-primary" : "text-muted-foreground/50"}>
                            {isComplete ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
