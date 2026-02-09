

## Replace Core Belief Section on Auth Page

### What Changes

**File: `src/pages/Auth.tsx`** (lines ~127-134)

Replace the current "Core Belief" block with three labeled pillars:

| Label | Description |
|---|---|
| **Signal to source** | We isolate the constraints that create repeat problems. |
| **Systems that stick** | Workflows, roles, scorecards, and cadence your team can run. |
| **Humane performance** | Clarity and ownership without grinding people down. |

### Technical Details

- Remove the single "Core Belief" heading and its subtitle ("Rooted . Clear . Unshakeable . Sharp . Humane")
- Replace with three small stacked items, each with a bold label and description, using the same styling conventions (uppercase tracking-widest for labels, muted-foreground for descriptions)
- The tagline below ("From smoke to source. Then we build the fix.") remains unchanged
- No changes to Dashboard, NoWorkspace, or other pages unless requested

