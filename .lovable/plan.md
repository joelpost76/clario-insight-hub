

## Improve Client Navigation UX: Add a Dedicated Client Page

### Problems Identified

1. **No dedicated client page** -- Clicking a client card only opens a sticky side panel on the dashboard. There's no full-page view for a client where you can see all their details, run modules, and manage their data in one place.

2. **No bridge from Admin to a client** -- The Admin page manages accounts, workspaces, and members, but there's no way to jump from Admin into a specific client's diagnostic view. Your message got cut off, but this is the gap: the Admin has "Enter Workspace" but no "View Client" action.

3. **Side panel feels like a dead end** -- The detail panel shows modules and recent activity, but it's cramped and doesn't invite deeper exploration. Clicking a client should feel like you're "entering" that client's space.

### Proposed Solution

Create a dedicated **Client Hub Page** at `/client/:clientId` that serves as the single landing page for any client. The dashboard card and Admin interface both link here.

```text
Dashboard (card grid)                Admin (workspace table)
     |                                    |
     |  click card                        |  "View Client" button
     v                                    v
  /client/:clientId  <--------------------+
  +---------------------------------------+
  | [Back to Dashboard]                   |
  |                                       |
  | Harlow Design + Build        [63]     |
  | Design-Build . $2M-$5M . 15 emp.     |
  |                                       |
  | --- Diagnostic Modules -----------    |
  | | RPE Assessment    | Score: 63  |    |
  | | Scope Creep       | Run ->     |    |
  | | P&L Margin        | Run ->     |    |
  | | Cash Flow         | Locked     |    |
  | -----------------------------------    |
  |                                       |
  | --- Recent Activity ---------------    |
  | RPE completed             Feb 19      |
  | -----------------------------------    |
  |                                       |
  | --- Recommended Next ---------------  |
  | Scope Creep analysis based on...      |
  +---------------------------------------+
```

### Changes

**1. New file: `src/pages/ClientHub.tsx`**
- Full-page client view with:
  - Back navigation to dashboard
  - Client header (name, industry, revenue, headcount, health ring)
  - Full-width module grid with run/resume actions (reuses the same `useClientModules` hook and navigation logic from Dashboard)
  - Recommended next module section
  - Recent activity timeline
  - Potential future: client notes, contact info, engagement history
- Uses `useParams()` to get `clientId`, fetches client from the `clients` table
- Module click behavior identical to current `handleRun` in Dashboard

**2. New route in `src/App.tsx`**
- Add `/client/:clientId` route pointing to `ClientHub`, wrapped in `RequireWorkspace`

**3. Update `src/pages/Dashboard.tsx`**
- Change `ClientCard` `onClick` to navigate to `/client/:clientId` instead of toggling the side panel
- Remove the `DetailPanel` component and all side-panel state (`selectedClientId`, `selectedModules`, `selectedHealth`) -- the dashboard becomes a clean card grid
- Keep the stats bar, search, and filters as-is

**4. Update `src/pages/Admin.tsx`**
- In the workspaces tab, add a way to see clients under a workspace
- Or: after "Enter Workspace", the admin lands on the dashboard where they can click into any client

### What This Improves

- **Clear hierarchy**: Dashboard (all clients) -> Client Hub (one client) -> Module (RPE, Scope Creep, etc.)
- **Deep-linkable**: `/client/abc123` can be shared or bookmarked
- **Admin flow**: Enter workspace from Admin, see client cards on dashboard, click into any client
- **Room to grow**: The client page can later hold notes, contacts, file uploads, and engagement history without cramming the dashboard

### Technical Details

- The `useClientModules(clientId)` hook already exists and works with a single client ID
- The `clients` table already has all needed fields (name, industry, revenue_range, headcount)
- No database changes or new dependencies required
- The health score calculation reuses the same RPE assessment query pattern from Dashboard

