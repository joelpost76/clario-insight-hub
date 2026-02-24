

## Fix: RPE Assessment 404 When Opened from Client Widget

### Problem
When clicking the RPE Assessment tile on a client widget in the dashboard, the app navigates to `/rpe/{clientId}` (line 669 of `Dashboard.tsx`). However, the router in `App.tsx` only defines a route for `/rpe` -- there is no `/rpe/:clientId` route. This causes a 404.

### Solution
Add a new route `/rpe/:clientId` in `App.tsx` that renders the same `RPEHealthCheck` component. The RPE Health Check component can then read the `clientId` param to scope its data to that specific client (similar to how the Scope Creep module works with `/scope-creep/:clientId`).

### Changes

**1. `src/App.tsx`**
- Add a new route: `/rpe/:clientId` pointing to `RPEHealthCheck`, wrapped in `RequireWorkspace`
- Keep the existing `/rpe` route as-is (for the summary card's "View Details" link)

**2. `src/modules/rpe/RPEHealthCheck.tsx`**
- Import `useParams` from `react-router-dom`
- Read the optional `clientId` param: `const { clientId } = useParams()`
- Use `clientId` (when present) to filter saved state and snapshots to that specific client, rather than loading workspace-wide data
- This ensures the RPE Health Check shows data scoped to the correct client when accessed from the client widget

### No database changes required
The `clientId` parameter is used for filtering existing data -- no new tables or columns are needed.

