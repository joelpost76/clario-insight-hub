import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role to check admin status and perform writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is unburnt_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "unburnt_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from("sales_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead.status === "workspace_created") {
      return new Response(JSON.stringify({ error: "Workspace already created for this lead" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create account from lead data
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        name: lead.company_name,
        industry: lead.industry || null,
        revenue_range: lead.revenue_range || null,
        headcount: lead.headcount || null,
      })
      .select()
      .single();

    if (accountError) {
      return new Response(JSON.stringify({ error: "Failed to create account: " + accountError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create workspace linked to that account
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        account_id: account.id,
        type: "clario_diagnostic",
        status: "active",
        day_counter: 1,
        start_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (wsError) {
      // Rollback account
      await supabase.from("accounts").delete().eq("id", account.id);
      return new Response(JSON.stringify({ error: "Failed to create workspace: " + wsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update lead status and link workspace
    await supabase
      .from("sales_leads")
      .update({
        status: "workspace_created",
        workspace_id: workspace.id,
      })
      .eq("id", lead_id);

    return new Response(
      JSON.stringify({
        success: true,
        account_id: account.id,
        workspace_id: workspace.id,
        company_name: lead.company_name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
