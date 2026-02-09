import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import unburntLogo from "@/assets/unburnt-clario-logo.png";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        
        toast({
          title: "Account created",
          description: "You can now sign in with your credentials.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      let message = error.message;
      
      if (message.includes("User already registered")) {
        message = "An account with this email already exists. Please sign in.";
        setIsLogin(true);
      } else if (message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-muted p-12 lg:flex">
        <div>
          <img 
            src={unburntLogo} 
            alt="Unburnt Clario" 
            className="h-24 w-auto"
          />
        </div>
        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg font-light leading-relaxed text-foreground/80">
              "Fix the work before it burns out the people."
            </p>
          </blockquote>
          <div className="space-y-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Signal to source</p>
              <p className="text-sm text-muted-foreground">We isolate the constraints that create repeat problems.</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Systems that stick</p>
              <p className="text-sm text-muted-foreground">Workflows, roles, scorecards, and cadence your team can run.</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Humane performance</p>
              <p className="text-sm text-muted-foreground">Clarity and ownership without grinding people down.</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          From smoke to source. Then we build the fix.
        </p>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex w-full flex-col justify-center bg-background p-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img 
              src={unburntLogo} 
              alt="Unburnt Clario" 
              className="h-14 w-auto"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to access your Clario™ workspace"
                : "Create your account to begin the diagnostic"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="h-11 w-full font-medium" 
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
            From smoke to source. Then we build the fix.
          </p>
        </div>
      </div>
    </div>
  );
}
