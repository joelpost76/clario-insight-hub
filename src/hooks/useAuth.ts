import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export function useAuth(redirectIfUnauthenticated = true) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const processedInvitationsRef = useRef(false);

  useEffect(() => {
    const processInvitations = async (currentSession: Session) => {
      if (processedInvitationsRef.current) return;
      processedInvitationsRef.current = true;
      try {
        await supabase.functions.invoke("process-pending-invitations", {
          headers: { Authorization: `Bearer ${currentSession.access_token}` },
        });
      } catch (err) {
        console.error("Failed to process pending invitations:", err);
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        processInvitations(session);
      }

      if (!session?.user && redirectIfUnauthenticated) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        processInvitations(session);
      }

      if (!session?.user && redirectIfUnauthenticated) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectIfUnauthenticated]);

  return { user, session, loading };
}
