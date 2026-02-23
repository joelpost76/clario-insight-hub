

## Add Revenue-Tiered RPE Benchmarks

### What Changes

Currently, the RPE benchmark bands are one-size-fits-all. A $1.5M firm and a $15M firm are judged against the same thresholds, which isn't realistic -- larger firms naturally have different efficiency profiles than smaller ones.

This plan introduces **four revenue tiers** with adjusted benchmark thresholds:

| Tier | Revenue Range | Critical | Caution | Average | Good | Strong |
|------|--------------|----------|---------|---------|------|--------|
| Emerging | Under $2M | < $80K | $80-120K | $120-170K | $170-230K | $230K+ |
| Growth | $2M - $5M | < $100K | $100-150K | $150-200K | $200-280K | $280K+ |
| Established | $5M - $10M | < $120K | $120-170K | $170-220K | $220-300K | $300K+ |
| Enterprise | $10M+ | < $140K | $140-190K | $190-250K | $250-330K | $330K+ |

**Why these numbers**: Smaller firms often run leaner with owner-operators wearing multiple hats, so a lower RPE is still healthy. Larger firms have more structured overhead, so the bar for "Strong" rises.

### Files Changed

**1. `src/modules/rpe/rpeTypes.ts`**
- Add a `RevenueTier` type: `"emerging" | "growth" | "established" | "enterprise"`
- Add a helper type for tier thresholds

**2. `src/modules/rpe/rpeCalculations.ts`**
- Add a `getRevenueTier(revenue)` function that maps annual revenue to a tier
- Add a tier-specific threshold table
- Update `getRPEBenchmark(totalRPE, revenue?)` to accept an optional `revenue` parameter -- when provided, it selects the appropriate tier's thresholds; when omitted, it falls back to the current "Growth" tier (backwards-compatible)
- Update benchmark descriptions to mention the tier context (e.g., "Strong for a firm at your revenue scale")

**3. `src/modules/rpe/RPEHealthCheck.tsx`**
- Pass `inputs.revenue` to `getRPEBenchmark(metrics.totalRPE, inputs.revenue)`
- Add a small indicator near the gauge showing which tier is active (e.g., a subtle badge: "Benchmarked for: $2-5M firms")
- Update the "How RPE is Calculated" explainer section to mention that benchmarks adjust by company size

### No database or dependency changes required
