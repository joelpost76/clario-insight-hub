

## Fix: "Could not find a relationship between workspace_members and profiles"

### Problem
The `fetchMembers` function uses a Supabase embedded select (`.select("*, profiles(full_name)")`) which requires a foreign key relationship between `workspace_members` and `profiles`. No such foreign key exists in the database schema.

### Solution
Replace the embedded/joined query with two separate queries:

1. Fetch workspace members normally (without the `profiles` join)
2. Fetch profiles separately for the member user IDs
3. Map profiles onto members in JavaScript

### Technical Details

**File: `src/pages/Admin.tsx`** (lines ~108-137)

Change the `fetchMembers` function:
- Remove `profiles(full_name)` from the `.select()` call — use just `"*"`
- After fetching members, collect all `user_id` values
- Query `profiles` table filtered by those user IDs (already done similarly for roles)
- Map profile data onto each member object

This avoids needing a database migration to add a foreign key, and keeps the fix minimal.

