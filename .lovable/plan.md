

# Intake Page Redesign: 4-Step Wizard

## Overview
Replace the existing single-scroll Intake page with a polished 4-step progressive form that feels like a professional consulting tool rather than a data entry screen.

## What stays the same
- Route remains `/intake` (wrapped in `RequireWorkspace`)
- Maps to the existing `intake_responses` table (no database changes needed)
- Uses the existing `WorkspaceContext` for workspace ID and completion refresh

## What changes

### New file structure
The current monolithic `src/pages/Intake.tsx` will be rewritten and broken into components:

- `src/pages/Intake.tsx` -- Main wizard controller (step state, form state, save logic)
- `src/components/intake/IntakeStepOne.tsx` -- Symptom Clusters
- `src/components/intake/IntakeStepTwo.tsx` -- Pain Ratings with color-coded sliders
- `src/components/intake/IntakeStepThree.tsx` -- Theory of Constraints questions
- `src/components/intake/IntakeStepFour.tsx` -- Decision Bottlenecks + Tool Tracker
- `src/components/intake/IntakeGuidanceCard.tsx` -- Reusable consultant guidance card
- `src/components/intake/IntakeProgressBar.tsx` -- Step progress indicator

### Step-by-step form details

**Step 1 -- Symptom Clusters**
- 12 checkboxes (same list as current)
- Textarea for recurring fire sentence
- Guidance card: explains why identifying symptoms matters
- Saves to: `symptom_clusters`, `recurring_fire_sentence`

**Step 2 -- Pain Ratings**
- 10 sliders (0-10) for workflow areas
- Rating number displayed beside each slider
- Color feedback: green (0-3), yellow (4-6), red (7-10) applied to the number badge
- Guidance card: explains the rating scale and how to think about severity
- Saves to: `pain_ratings` as JSONB array of `{area, rating}`

**Step 3 -- Theory of Constraints**
- 3 textareas with hint text as placeholders
- Guidance card: brief intro to TOC thinking for the consultant
- Saves to: `toc_wait_points`, `toc_replanning_points`, `toc_one_fix_effect`

**Step 4 -- Decision Bottlenecks + Metrics**
- Textarea for decisions bottleneck
- Tool tracker: input for name + purpose, add button, deletable list
- Textarea for metrics tracked today
- Guidance card: context on why tools and metrics matter
- Saves to: `decisions_bottleneck`, `tools_list`, `metrics_tracked_today`

### UX features
- Progress bar at top: "Step X of 4" with visual percentage bar
- Previous / Save Draft / Next (or Save Intake on step 4) navigation buttons
- Auto-save on step transitions
- "Back to Dashboard" link in the header
- Header: "Intake" with subtitle "Capture the signal. Start where it hurts. Stay precise."

### Validation
- **Draft saves**: no validation required, partial data accepted
- **Final save (step 4 "Save intake")**: checks 75%+ completion
  - 8 fields, each worth 12.5%
  - Symptom clusters: at least 1 selected
  - Pain ratings: at least 3 areas rated
  - Text fields: at least 20 characters each
  - Tools list: at least 1 tool added
- Toast feedback on validation failure showing which fields are incomplete

### Data persistence
- On mount, loads existing `intake_responses` row for the workspace (if any)
- Upsert logic: insert if new, update if existing (same pattern as current)
- `tools_list` stored as JSONB array of `{name: string, purpose?: string}`
- `pain_ratings` stored as JSONB (keeping the existing key-value format for backward compatibility)
- Calls `refreshCompletionStatus()` after successful save

---

## Technical details

### Form management
- React Hook Form with Zod schema for the full form shape
- `useForm` at the parent level, each step component receives form methods via props
- Partial Zod schema used for draft validation (all fields optional)
- Full Zod schema used for final save validation

### Data fetching
- TanStack Query `useQuery` to load existing intake data
- TanStack Query `useMutation` for save/update operations
- Query key: `["intake", workspaceId]`
- Invalidates `["intake", workspaceId]` and triggers `refreshCompletionStatus` on success

### Styling
- Uses existing beige/sage CSS variables (Off-White background, Leaf Green accents)
- Guidance cards: light sage/beige background with a subtle border
- Slider color feedback via conditional Tailwind classes on the rating number
- shadcn/ui components: Button, Card, Checkbox, Input, Textarea, Slider, Progress, Label
- lucide-react icons: ChevronLeft, ChevronRight, Save, CheckCircle2, AlertCircle
- Responsive layout: max-w-3xl centered, stacks cleanly on mobile

### Files to create/modify
1. **Rewrite** `src/pages/Intake.tsx` -- wizard controller
2. **Create** `src/components/intake/IntakeStepOne.tsx`
3. **Create** `src/components/intake/IntakeStepTwo.tsx`
4. **Create** `src/components/intake/IntakeStepThree.tsx`
5. **Create** `src/components/intake/IntakeStepFour.tsx`
6. **Create** `src/components/intake/IntakeGuidanceCard.tsx`
7. **Create** `src/components/intake/IntakeProgressBar.tsx`

No database migrations needed -- the `intake_responses` table already has all required columns including `tools_list`.

