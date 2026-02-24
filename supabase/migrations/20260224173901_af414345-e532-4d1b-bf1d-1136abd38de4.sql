
-- Reset invitations that were prematurely marked as 'accepted' by the old trigger.
-- These are invitations where the invited user has never actually confirmed their email
-- (email_confirmed_at IS NULL in auth.users), meaning they never clicked the invite link.
UPDATE public.invitations
SET status = 'pending', accepted_at = NULL
WHERE status = 'accepted'
  AND lower(email) IN (
    SELECT lower(u.email)
    FROM auth.users u
    WHERE u.email_confirmed_at IS NULL
  );
