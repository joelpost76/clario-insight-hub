import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2, FolderKanban, Users, UserPlus, Settings, ExternalLink, RotateCcw } from "lucide-react";
import { Account, Workspace } from "@/types/database";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface WorkspaceMemberWithProfile {
  id: string;
  user_id: string;
  workspace_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
  user_email?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const { switchWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState("accounts");

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountIndustry, setNewAccountIndustry] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<(Workspace & { account_name?: string })[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);

  // Members state
  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);

  // Delete confirmation state
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteWorkspaceId, setDeleteWorkspaceId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching accounts", description: error.message, variant: "destructive" });
    } else {
      setAccounts(data as Account[]);
    }
  };

  // Fetch workspaces with account names
  const fetchWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*, accounts(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching workspaces", description: error.message, variant: "destructive" });
    } else {
      const workspacesWithAccountNames = data.map((ws: any) => ({
        ...ws,
        account_name: ws.accounts?.name,
      }));
      setWorkspaces(workspacesWithAccountNames);
    }
  };

  // Fetch members for a workspace
  const fetchMembers = async (workspaceId: string) => {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("*, profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching members", description: error.message, variant: "destructive" });
    } else {
      setMembers(data.map((m: any) => ({
        ...m,
        profile: m.profiles,
      })));
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchMembers(selectedWorkspaceId);
    } else {
      setMembers([]);
    }
  }, [selectedWorkspaceId]);

  // Create account
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("accounts").insert({
      name: newAccountName.trim(),
      industry: newAccountIndustry.trim() || null,
    });

    if (error) {
      toast({ title: "Error creating account", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created successfully" });
      setNewAccountName("");
      setNewAccountIndustry("");
      setAccountDialogOpen(false);
      fetchAccounts();
    }
  };

  // Delete account
  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting account", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account deleted" });
      fetchAccounts();
      fetchWorkspaces();
    }
  };

  // Create workspace
  const handleCreateWorkspace = async () => {
    if (!selectedAccountId) {
      toast({ title: "Please select an account", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("workspaces").insert({
      account_id: selectedAccountId,
      type: "clario_diagnostic",
      status: "active",
      day_counter: 1,
    });

    if (error) {
      toast({ title: "Error creating workspace", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Workspace created successfully" });
      setSelectedAccountId("");
      setWorkspaceDialogOpen(false);
      fetchWorkspaces();
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async (id: string) => {
    const { error } = await supabase.from("workspaces").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting workspace", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Workspace deleted" });
      fetchWorkspaces();
    }
  };

  // Enter workspace and navigate to dashboard
  const handleEnterWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
  };

  // Reset welcome page for a workspace (clears localStorage flag for all users on this browser)
  const handleResetWelcome = (workspaceId: string) => {
    localStorage.removeItem(`welcome_seen_${workspaceId}`);
    toast({ title: "Welcome page reset", description: "The welcome page will show again on next visit to this workspace." });
  };

  // Add member to workspace
  const handleAddMember = async () => {
    if (!selectedWorkspaceId || !newMemberEmail.trim()) {
      toast({ title: "Workspace and email are required", variant: "destructive" });
      return;
    }

    // First find the user by email using profiles or auth
    // Since we can't query auth.users directly, we'll use the user_id directly
    // For now, the admin needs to provide the user_id (we'll improve this with a user lookup)
    
    // Look up user in profiles by checking if they exist
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(100);

    if (profileError) {
      toast({ title: "Error looking up users", description: profileError.message, variant: "destructive" });
      return;
    }

    // For demo purposes, we'll add by user_id directly
    // In production, you'd use an edge function to look up by email
    const userId = newMemberEmail.trim();

    // Check if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      toast({ 
        title: "Invalid user ID", 
        description: "Please enter a valid user UUID. (Note: Email lookup requires an edge function)",
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: selectedWorkspaceId,
      user_id: userId,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "User is already a member of this workspace", variant: "destructive" });
      } else {
        toast({ title: "Error adding member", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Member added successfully" });
      setNewMemberEmail("");
      setMemberDialogOpen(false);
      fetchMembers(selectedWorkspaceId);
    }
  };

  // Remove member from workspace
  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);

    if (error) {
      toast({ title: "Error removing member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      if (selectedWorkspaceId) {
        fetchMembers(selectedWorkspaceId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage accounts, workspaces, and users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="accounts" className="gap-2">
              <Building2 className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Accounts</CardTitle>
                  <CardDescription>Manage client accounts</CardDescription>
                </div>
                <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Account</DialogTitle>
                      <DialogDescription>Add a new client account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          placeholder="Enter account name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={newAccountIndustry}
                          onChange={(e) => setNewAccountIndustry(e.target.value)}
                          placeholder="e.g., Construction, Healthcare"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAccount}>Create Account</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No accounts yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>{account.industry || "—"}</TableCell>
                          <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteAccountId(account.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Workspaces</CardTitle>
                  <CardDescription>Manage diagnostic workspaces</CardDescription>
                </div>
                <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Workspace</DialogTitle>
                      <DialogDescription>Create a new Clario Diagnostic workspace</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Account *</Label>
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWorkspaceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWorkspace}>Create Workspace</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No workspaces yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      workspaces.map((workspace) => (
                        <TableRow 
                          key={workspace.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedWorkspaceId(workspace.id);
                            setActiveTab("members");
                          }}
                        >
                          <TableCell className="font-medium">{workspace.account_name || "Unknown"}</TableCell>
                          <TableCell>{workspace.type}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              workspace.status === "active" 
                                ? "bg-primary/10 text-primary" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {workspace.status}
                            </span>
                          </TableCell>
                          <TableCell>{workspace.day_counter}</TableCell>
                          <TableCell>{new Date(workspace.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnterWorkspace(workspace.id);
                              }}
                              className="text-primary hover:text-primary"
                              title="Enter Workspace"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetWelcome(workspace.id);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                              title="Reset Welcome Page"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkspaceId(workspace.id);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete Workspace"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Workspace Members</CardTitle>
                    <CardDescription>Manage user access to workspaces</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((ws) => (
                          <SelectItem key={ws.id} value={ws.id}>
                            {ws.account_name} - {ws.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" disabled={!selectedWorkspaceId}>
                          <UserPlus className="h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member</DialogTitle>
                          <DialogDescription>Add a user to the selected workspace</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="userId">User ID (UUID) *</Label>
                            <Input
                              id="userId"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              placeholder="Enter user UUID"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter the user's UUID from the authentication system.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddMember}>Add Member</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedWorkspaceId ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">Select a workspace to view members</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No members in this workspace
                          </TableCell>
                        </TableRow>
                      ) : (
                        members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-mono text-xs">{member.user_id}</TableCell>
                            <TableCell>{member.profile?.full_name || "—"}</TableCell>
                            <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteMemberId(member.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Delete Account Confirmation */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account and all associated workspaces. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteAccountId) handleDeleteAccount(deleteAccountId);
                setDeleteAccountId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Workspace Confirmation */}
      <AlertDialog open={!!deleteWorkspaceId} onOpenChange={(open) => !open && setDeleteWorkspaceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workspace and all its data (interviews, surveys, artifacts, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteWorkspaceId) handleDeleteWorkspace(deleteWorkspaceId);
                setDeleteWorkspaceId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!deleteMemberId} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user from this workspace. They will lose access to all workspace data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteMemberId) handleRemoveMember(deleteMemberId);
                setDeleteMemberId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
