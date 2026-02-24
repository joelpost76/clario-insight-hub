
## Show Company Name on the RPE Health Check Page

### Problem
The RPE page header shows "RPE Health Check" with version and tier badges, but there's no indication of **which company** the data belongs to. Users managing multiple workspaces have no context for whose numbers they're looking at.

### Solution
Pull the workspace's `account_name` (company name) from the existing `WorkspaceContext` and display it prominently in the page header, just above or inline with the title.

### Changes (1 file)

**`src/modules/rpe/RPEHealthCheck.tsx`**

1. Update the destructured workspace context from `{ workspaceId }` to `{ workspaceId, workspace }` (line 157)
2. Add the company name above the "RPE Health Check" title as a small breadcrumb-style label:
   ```
   [Company Name]          <- new: small muted text showing account_name
   RPE Health Check  rpe_v1  Benchmarked for: $2M-$5M firms
   ```
   This will be a `<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">` showing `workspace?.account_name` or the workspace name as a fallback.

### No database, dependency, or structural changes needed
The `account_name` field is already loaded by the WorkspaceContext -- we just need to display it.
