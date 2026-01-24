import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users } from "lucide-react";

interface Interview {
  id: string;
  name: string;
  role: string;
  email: string;
  scheduled: boolean;
}

export default function Interviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter name and role.",
        variant: "destructive",
      });
      return;
    }

    const newInterview: Interview = {
      id: crypto.randomUUID(),
      name: formData.name,
      role: formData.role,
      email: formData.email,
      scheduled: false,
    };

    setInterviews((prev) => [...prev, newInterview]);
    setFormData({ name: "", role: "", email: "" });
    setShowForm(false);
    toast({
      title: "Interview added",
      description: `${newInterview.name} has been added to the roster.`,
    });
  };

  const handleDelete = (id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    toast({
      title: "Interview removed",
      description: "The interviewee has been removed.",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Interviews</h1>
            <p className="mt-1 text-muted-foreground">
              Build your interview roster. We'll schedule 30-minute sessions with each person.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Interviewee
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New Interviewee</CardTitle>
              <CardDescription>
                Who should we talk to? Include people who do the work and people who manage it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Project Manager"
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add to Roster</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Interview Roster</CardTitle>
            <CardDescription>
              {interviews.length} interviewee{interviews.length !== 1 ? "s" : ""} listed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No interviewees yet. Add people who can explain how work really flows.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">{interview.name}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.role}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.email}</TableCell>
                      <TableCell>
                        <Badge variant={interview.scheduled ? "default" : "secondary"}>
                          {interview.scheduled ? "Scheduled" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(interview.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
