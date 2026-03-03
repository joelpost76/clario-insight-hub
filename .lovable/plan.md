

## Problem

The "Enter Workspace" button on the Admin Workspaces tab calls `switchWorkspace()`, but that function (line 128 of `WorkspaceContext.tsx`) only works for workspaces in `availableWorkspaces` — which is limited to workspaces the admin is a **member** of. If the admin is not a member, clicking the button does nothing.

Additionally, even if we bypass that check, `RequireWorkspace` would redirect the admin away because `workspaceId` wouldn't be set for non-member workspaces.

## Solution

Enhance the workspace context to support an **admin override** — allowing `unburnt_admin` users to enter any workspace regardless of membership.

### Changes

**A. `src/contexts/WorkspaceContext.tsx`**

Update `switchWorkspace` to accept any workspace ID for admins:
- If the target workspace is already in `availableWorkspaces`, use it as-is (current behavior).
- Otherwise, if the user is an `unburnt_admin`, fetch the workspace directly from the database, set it as the active workspace, and navigate to `/dashboard`.
- Store the admin-entered workspace in state so `RequireWorkspace` sees a valid `workspaceId`.

```text
switchWorkspace(newWorkspaceId)
  |
  Is workspace in availableWorkspaces?
  ├── Yes → set it, navigate to /dashboard (current)
  └── No → Is user unburnt_admin?
      ├── Yes → fetch workspace from DB, set it, navigate to /dashboard
      └── No → do nothing (current)
```

**B. No changes needed to `RequireWorkspace`** — it already checks `workspaceId` (which will now be set for admin-entered workspaces) and has an admin fallback path.

**C. No changes needed to `Admin.tsx`** — `handleEnterWorkspace` already calls `switchWorkspace`.

### Summary

Single file change to `WorkspaceContext.tsx`: make `switchWorkspace` fetch and set any workspace for admin users, not just ones they're members of.

