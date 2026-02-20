// RPEGauge — a simple SVG arc gauge that shows Total RPE against the benchmark scale.
// Deliberately minimal so it reads clearly on a laptop in a workshop setting.

import type { RPEBenchmark } from "./rpeTypes";

interface RPEGaugeProps {
  value: number;       // e.g. 185000
  max?: number;        // top of the gauge scale, default 400000
  benchmark: RPEBenchmark;
}

const COLOUR_MAP: Record<RPEBenchmark["variant"], string> = {
  critical: "#ef4444",   // red
  caution:  "#f59e0b",   // amber
  average:  "#6366f1",   // indigo
  good:     "#22c55e",   // green
  strong:   "#10b981",   // emerald
};

export function RPEGauge({ value, max = 400_000, benchmark }: RPEGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = clamped / max; // 0 – 1

  // Arc geometry — semicircle, 180°
  const cx = 110;
  const cy = 110;
  const r  = 80;
  const strokeW = 16;

  // SVG arc helper: returns a path string for a portion of a circle
  const arcPath = (startAngle: number, endAngle: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const sx = cx + r * Math.cos(toRad(startAngle));
    const sy = cy + r * Math.sin(toRad(startAngle));
    const ex = cx + r * Math.cos(toRad(endAngle));
    const ey = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  // 180° gauge from 180° (left) to 0° (right) — start at left, sweep right
  const startAngle = 180;
  const totalSweep  = 180;
  const fillAngle  = startAngle + totalSweep * pct;

  const trackPath = arcPath(180, 0);
  const fillPath  = arcPath(180, fillAngle <= 360 ? fillAngle : 360);

  const colour = COLOUR_MAP[benchmark.variant];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 220 130" className="w-56 h-auto" aria-label={`RPE gauge: ${benchmark.label}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Fill */}
        {pct > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={colour}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Centre value */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-foreground"
          fontSize="20"
          fontWeight="600"
          fill="currentColor"
        >
          {value > 0 ? `$${Math.round(value / 1000)}k` : "—"}
        </text>
        {/* Benchmark label */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill={colour}
          fontWeight="500"
        >
          {benchmark.label}
        </text>
      </svg>
    </div>
  );
}
