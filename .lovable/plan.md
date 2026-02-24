

## Fix: Invitation Status and "Add Existing Member" Flow

### Root Cause

The `handle_new_user` database trigger fires when `inviteUserByEmail()` creates the user in the auth system. This happens **immediately at invite time**, not when the user actually accepts. The trigger then:
1. Marks the invitation as "Accepted" (premature)
2. Adds the user to `workspace_members` (premature)
3. Assigns the role (premature)

This means:
- The invitation incorrectly shows "Accepted" in the Admin UI
- "Add Existing Member" fails because they're already in `workspace_members`
- The user never actually set a password or logged in

There's also a secondary bug: the invite email's redirect URL is built incorrectly from the backend URL instead of the actual app URL.

### Solution

**1. Update `handle_new_user` trigger function (database migration)**

Modify the trigger to only process pending invitations when the user has actually confirmed their email (i.e., `email_confirmed_at` is set). Users created by `inviteUserByEmail` initially have `email_confirmed_at = NULL` until they click the link and set a password.

```sql
-- Only process invitations if the user has confirmed their email
IF NEW.email_confirmed_at IS NOT NULL THEN
  -- existing invitation processing logic
END IF;
```

**2. Add a second trigger for `UPDATE` on `auth.users`**

When the invited user finally clicks the link and confirms, the `email_confirmed_at` field gets updated. A new trigger on UPDATE will catch this event and process the pending invitations at that point.

Wait -- we cannot attach triggers to `auth.users` (reserved schema). Instead:

**Revised approach:** Move invitation processing out of the trigger entirely. Instead, process pending invitations at **login time** in the application code.

**3. Update the application login flow**

After a user successfully authenticates (in `useAuth` or a post-login hook), check for pending invitations matching their email and process them:
- Add them to `workspace_members`
- Assign the invited role
- Mark the invitation as "accepted"

This is done via a new edge function `process-pending-invitations` that runs with service role privileges.

**4. Fix the invite redirect URL**

In the `invite-user` edge function, change the redirect URL from the broken backend-derived URL to the actual published app URL.

### Changes

**A. Database migration**
- Update `handle_new_user()` to NOT process invitations (only create the profile and assign default role if no invitations exist). Remove the invitation-acceptance loop from this function.

**B. New edge function: `supabase/functions/process-pending-invitations/index.ts`**
- Called after login with the user's auth token
- Looks up pending invitations matching the user's email
- For each: inserts into `workspace_members`, assigns role, marks invitation as "accepted"
- Uses service role to bypass RLS

**C. Update `src/hooks/useAuth.ts`**
- After successful auth state change (user signs in), call the `process-pending-invitations` edge function once
- This ensures invitations are only accepted when the user actually logs in

**D. Update `supabase/functions/invite-user/index.ts`**
- Fix redirect URL: use the published app URL (`https://clario-insight-hub.lovable.app/dashboard`) instead of the malformed backend-derived URL
- Remove the premature workspace_member insertion for invited (non-existing) users -- the invitation record is sufficient; membership is created at login time

**E. Update `supabase/config.toml`**
- Add the new `process-pending-invitations` function config

### Flow After Fix

```text
Admin sends invite
  |
  v
invite-user edge function:
  - User exists? -> Add to workspace directly (existing behavior, correct)
  - User doesn't exist? -> Create invitation record + send auth invite email
  |
  v
User clicks email link, sets password, logs in
  |
  v
useAuth detects sign-in -> calls process-pending-invitations
  |
  v
Edge function processes pending invitations:
  - Adds user to workspace_members
  - Assigns role
  - Marks invitation as "accepted"
```

### What This Fixes

- Invitations will correctly show "Pending" until the user actually signs in
- "Add Existing Member" will work for users who have confirmed their account
- The invite email link will redirect to the correct app URL
- No changes to the auth schema (triggers stay on public schema only)

