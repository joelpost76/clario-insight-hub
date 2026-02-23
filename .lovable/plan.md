

## Improve Readability of the "How RPE is Calculated" Section

### Problem

The input tag chips use `bg-primary/10 text-primary`, which resolves to olive-green text on a light green background. This creates poor contrast and is hard to read, especially at the tiny 10px font size. The overall card styling also blends together due to low-contrast borders and muted backgrounds.

### Proposed Changes

All changes are in **one file**: `src/modules/rpe/RPEHealthCheck.tsx` (the `FormulaCard` component, lines 133-150).

#### 1. Input tag chips -- fix the green-on-green problem

Replace `bg-primary/10 text-primary` with a higher-contrast combination:

- **Option chosen:** Use `bg-foreground/8 text-foreground/70` -- neutral dark chips that read well on any background, and visually distinguish "inputs used" from the green accent color used elsewhere for interactive/active states.

#### 2. Card background -- slightly more definition

Change `bg-muted/30` to `bg-card` with a subtle border so each formula card feels distinct and readable against the page background.

#### 3. Formula code block -- bump contrast

The `code` block already uses `bg-background text-foreground`, which is fine. No change needed there.

#### 4. Section headers -- add a subtle bottom border

Add a small bottom border/separator below each section title ("PRIMARY RPE METRICS", etc.) to visually group the cards underneath.

### Technical details

**File:** `src/modules/rpe/RPEHealthCheck.tsx`

**FormulaCard component (lines 133-150):**
- Line 134: Change card container from `bg-muted/30` to `bg-card border`
- Line 144: Change chip classes from `bg-primary/10 text-primary` to `bg-muted text-muted-foreground border border-border`

**Section headers (lines ~384, ~392, ~400):**
- Add `pb-1 border-b` to each `<h3>` section header for visual separation

No new files, no new dependencies, no database changes.
