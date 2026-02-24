import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending invitations for this email
    const { data: pendingInvites, error: fetchError } = await adminClient
      .from("invitations")
      .select("id, workspace_id, role")
      .eq("status", "pending")
      .ilike("email", userEmail);

    if (fetchError) {
      console.error("Error fetching invitations:", fetchError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch invitations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingInvites || pendingInvites.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;

    for (const inv of pendingInvites) {
      // Add to workspace_members
      const { error: memberError } = await adminClient
        .from("workspace_members")
        .insert({ workspace_id: inv.workspace_id, user_id: user.id })
        .select()
        .maybeSingle();

      if (memberError && !memberError.message.includes("duplicate")) {
        console.error(`Error adding member to workspace ${inv.workspace_id}:`, memberError.message);
        continue;
      }

      // Assign role
      await adminClient
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: inv.role },
          { onConflict: "user_id,role" }
        );

      // Mark invitation as accepted
      await adminClient
        .from("invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", inv.id);

      processed++;
      console.log(`Processed invitation ${inv.id} for ${userEmail} -> workspace ${inv.workspace_id}`);
    }

    return new Response(
      JSON.stringify({ processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
