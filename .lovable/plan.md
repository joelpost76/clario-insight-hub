

## Admin Knowledge Hub

### What We're Building
A new "Knowledge Hub" tab inside the Admin Dashboard that documents how every section of Clario works, how outcomes are calculated, and what external data sources/APIs are used. Access is restricted to `unburnt_admin` users (already enforced by `RequireAdmin` on `/admin`).

### Approach: Static Documentation Registry

Rather than attempting true "auto-updating" documentation (which would require code introspection infrastructure), we will create a **structured documentation registry** -- a single TypeScript data file (`src/data/knowledgeHub.ts`) containing an array of documentation entries. Each entry covers a module/feature and includes:

- **Module name** and category (Diagnostic Step, Tool, AI Engine, Admin)
- **Description** of what it does
- **How outcomes are calculated** (formulas, logic, AI prompts)
- **Data sources** (database tables, edge functions, external APIs)
- **Last updated** timestamp

This registry acts as a living reference. When any developer adds or modifies a feature, they update the corresponding entry in this single file -- making it the canonical source of truth.

### Technical Details

**1. New file: `src/data/knowledgeHub.ts`**

A typed array of ~15 documentation entries covering:
- Kickoff, Intake, Constraint Analysis, Flow Stabilization, Scope & Change Discipline, Artifacts, Interviews, Team Survey, SIPOC, Workflow Mapping, Flow Baseline, Synthesis, Readout
- RPE Health Check, Scope Creep Assessment
- AI engine details (Gemini Flash via Lovable AI gateway, single-pass prompt architecture, no learning loop)
- Edge functions catalog (analyze-constraint, analyze-flow-stabilization, analyze-scope-discipline, create-workspace-from-lead, invite-user, lookup-user-by-email, process-pending-invitations)

Each entry will have the same depth you saw in the constraint analysis explanation: data flow, calculation logic, limitations.

**2. New component: `src/components/admin/KnowledgeHub.tsx`**

An accordion-based UI that renders the registry entries grouped by category. Each expanded section shows:
- Overview paragraph
- "How it works" detail
- Calculation methodology (where applicable)
- Data sources table (tables, edge functions, APIs)
- Last updated date

**3. Modified file: `src/pages/Admin.tsx`**

Add a fourth tab "Knowledge Hub" (with a `BookOpen` icon) to the existing `TabsList`. The tab content renders the `KnowledgeHub` component.

**4. No database or RLS changes needed** -- this is purely frontend documentation, already protected by the `RequireAdmin` route guard.

### Initial Content Scope

The registry will be pre-populated with detailed entries for all 15+ modules, matching the level of detail from the constraint analysis explanation (data inputs, processing pipeline, output schema, limitations, external dependencies).

