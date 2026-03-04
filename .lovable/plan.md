

# Clario Animated Walkthrough — Auto-Playing Timeline

## Overview
A standalone marketing page at `/how-clario-works` that presents the Clario diagnostic as a cinematic auto-playing timeline. Each stage animates in with timed transitions, accompanied by a progress bar and play/pause controls. The page is public (no auth required) and matches the existing brand design system.

## Page Structure

The walkthrough presents 5 scenes that auto-advance every ~6 seconds:

```text
┌─────────────────────────────────────────────────┐
│  UNBURNT logo          [Pause] [Restart]        │
│                                                 │
│  ━━━━━━━━●━━━━━━━━━━━━━━━━━━━━  (progress bar)  │
│  1 · 2 · 3 · 4 · 5   scene dots                │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │   [Icon animates in]                    │    │
│  │                                         │    │
│  │   Scene Title (fade + slide up)         │    │
│  │   Subtitle (staggered fade)             │    │
│  │                                         │    │
│  │   • Bullet 1  (staggered reveal)        │    │
│  │   • Bullet 2                            │    │
│  │   • Bullet 3                            │    │
│  │                                         │    │
│  │   "Your time: X hours" (fade in last)   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ◄ Prev                              Next ►    │
│                                                 │
│  [CTA: Find Your Constraint — $7,500]           │
│  footer                                         │
└─────────────────────────────────────────────────┘
```

## 5 Scenes

1. **The Problem** — Your company has 47 symptoms but only ONE constraint
2. **Capture the Signals** (Days 1–3) — Interviews, workflow observation, data review
3. **Trace to the Source** (Days 4–7) — Map breakdowns, isolate the bottleneck
4. **The 90-Day Fix Plan** (Days 8–10) — Prioritized actions, assigned owners, KPIs
5. **Walk Away With Clarity** — Root-Cause Map, Workflow Breakdown, Implementation Plan

## Animation Approach

- Each scene uses CSS transitions (opacity, translateY, scale) with staggered delays
- Scene transitions: current scene fades out, next scene fades in (300ms crossfade)
- Progress bar fills continuously using CSS `transition: width` synced to the timer
- Scene dot indicators highlight the active scene
- Icon for each scene scales in from 0.8 to 1.0
- Bullets appear one by one with 200ms stagger

## Controls

- **Auto-play**: Advances every 6 seconds, loops back to scene 1
- **Pause/Play** toggle button
- **Prev/Next** arrow buttons (also resets the 6s timer)
- **Dot navigation**: Click any dot to jump to that scene
- **Keyboard**: Arrow keys and spacebar for pause/play

## Technical Plan

| Step | Detail |
|------|--------|
| Create `src/pages/HowClarioWorks.tsx` | Main page component with timer logic, scene state, and controls |
| Create `src/components/walkthrough/WalkthroughScene.tsx` | Reusable scene renderer with staggered entrance animations |
| Create `src/components/walkthrough/WalkthroughControls.tsx` | Progress bar, dots, prev/next, pause/play |
| Add route in `App.tsx` | Public route at `/how-clario-works` |
| Add nav link | CTA from GetStarted page links to this walkthrough |

Brand tokens, grid background, and glow effects will match the existing sales landing page. The page will use the same `Off-White` background, `Leaf Green` accent, and `Charcoal` text from the design system.

