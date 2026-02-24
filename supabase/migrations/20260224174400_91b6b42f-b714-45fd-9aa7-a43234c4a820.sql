
-- Remove premature workspace_members entries for users who never confirmed their email.
-- These were created by the old handle_new_user trigger at invite time.
DELETE FROM public.workspace_members
WHERE user_id IN (
  SELECT u.id
  FROM auth.users u
  WHERE u.email_confirmed_at IS NULL
);
