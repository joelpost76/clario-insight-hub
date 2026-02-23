

## Add Helper Text and Tooltips to RPE Health Check Inputs

### What changes

The `FormField` component in `src/modules/rpe/RPEHealthCheck.tsx` will be extended with an optional `hint` prop that renders a short description below each label. Each input field will get a concise explanation of what it does -- whether it drives RPE directly or serves as a workload indicator.

### Field hints

**Core section** (drives RPE directly):
- **Annual Revenue** -- "Drives all RPE calculations. Total RPE = Revenue / Total FTE."
- **Field FTE** -- "Directly affects Field RPE and Total RPE. These are your billable, project-facing staff."
- **Non-Field FTE** -- "Directly affects Non-Field RPE and Total RPE. Overhead, admin, and support roles."

**Volume section** (secondary metrics):
- **Average Contract Value** -- "Used to estimate jobs per year and workload per role. Does not affect RPE."
- **Current Backlog** -- "Used to calculate Backlog Months. Does not affect RPE."

**Role Counts section** (workload indicators only):
- **Project Managers** -- "Workload indicator only. Shows jobs per PM -- does not change RPE."
- **Designers** -- "Workload indicator only. Shows jobs per Designer -- does not change RPE."
- **Sales Reps** -- "Workload indicator only. Shows jobs per Sales Rep -- does not change RPE."

Additionally, the section headers ("Core", "Volume", "Role Counts") will each get a one-line subtitle clarifying the section's purpose:
- Core: "These three fields drive all RPE figures."
- Volume: "Feed workload and backlog metrics -- not RPE itself."
- Role Counts: "Workload indicators only -- these do not affect RPE."

### Technical details

**File modified:** `src/modules/rpe/RPEHealthCheck.tsx`

1. Add an optional `hint?: string` prop to the `FormField` component (lines 68-114). Render it as a `<p className="text-[11px] text-muted-foreground leading-snug">` below the `<Label>`.

2. Pass `hint` strings to each `<FormField>` call in the inputs card (lines 354-433).

3. Add a small `<p>` subtitle below each section header (`"Core"`, `"Volume"`, `"Role Counts"`) at lines 351, 385, and 410.

No new files, no new dependencies, no database changes.

