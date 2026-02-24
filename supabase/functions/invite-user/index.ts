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
    // Authenticate the calling user
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

    // Verify the caller is authenticated
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Check that the caller has unburnt_admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "unburnt_admin")
      .maybeSingle();

    if (!roleData) {
      console.error("Non-admin user attempted invite:", callerId);
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, workspace_id, role } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!workspace_id || typeof workspace_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Workspace ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assignRole = role || "client_user";
    const normalizedEmail = email.trim().toLowerCase();

    console.log(`Inviting ${normalizedEmail} to workspace ${workspace_id} with role ${assignRole}`);

    // Check if user already exists
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError.message);
      return new Response(
        JSON.stringify({ error: "Failed to check existing users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingUser = users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // Check if the user has actually confirmed their email (i.e. they clicked the link and signed in)
      const isConfirmed = !!existingUser.email_confirmed_at;

      if (isConfirmed) {
        // Fully confirmed user - check if already a member
        const { data: existingMember } = await adminClient
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (existingMember) {
          return new Response(
            JSON.stringify({ error: "User is already a member of this workspace" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Add confirmed user directly to workspace
        const { error: memberError } = await adminClient
          .from("workspace_members")
          .insert({ workspace_id, user_id: existingUser.id });

        if (memberError) {
          console.error("Error adding member:", memberError.message);
          return new Response(
            JSON.stringify({ error: "Failed to add member to workspace" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Assign role if not already assigned
        await adminClient
          .from("user_roles")
          .upsert(
            { user_id: existingUser.id, role: assignRole },
            { onConflict: "user_id,role" }
          );

        console.log(`Existing confirmed user ${normalizedEmail} added to workspace directly`);

        return new Response(
          JSON.stringify({
            status: "added",
            message: `${normalizedEmail} has been added to the workspace.`,
            user_id: existingUser.id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // User exists in auth but hasn't confirmed — treat as a resend/new invite
      console.log(`User ${normalizedEmail} exists but unconfirmed — resending invite`);
    }

    // User doesn't exist - create invitation record
    const { data: invitation, error: inviteError } = await adminClient
      .from("invitations")
      .upsert(
        {
          email: normalizedEmail,
          workspace_id,
          role: assignRole,
          invited_by: callerId,
          status: "pending",
        },
        { onConflict: "email,workspace_id" }
      )
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Supabase invite email (creates the user in auth with an invite link)
    const { data: invitedUser, error: inviteAuthError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: 'https://clario-insight-hub.lovable.app/auth',
      }
    );

    if (inviteAuthError) {
      // If invite fails (e.g. already invited), still keep the invitation record
      console.warn("Auth invite warning:", inviteAuthError.message);
    } else {
      console.log(`Invite email sent to ${normalizedEmail}`);
    }

    return new Response(
      JSON.stringify({
        status: "invited",
        message: `Invitation sent to ${normalizedEmail}. They will be auto-assigned to the workspace when they sign up.`,
        invitation_id: invitation.id,
      }),
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
