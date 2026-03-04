import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Ear, Search, ClipboardList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalkthroughScene, type SceneData } from "@/components/walkthrough/WalkthroughScene";
import { WalkthroughControls } from "@/components/walkthrough/WalkthroughControls";
import logo from "@/assets/unburnt-clario-logo.png";

const SCENE_DURATION = 6000; // ms
const TICK = 50; // progress tick interval

const scenes: SceneData[] = [
  {
    icon: AlertTriangle,
    title: "The Problem",
    subtitle: "Your company has 47 symptoms — but only ONE constraint.",
    bullets: [
      "Missed deadlines, rework, budget overruns, burnout",
      "Every department points the finger somewhere else",
      "You've tried fixing everything — nothing sticks",
    ],
  },
  {
    icon: Ear,
    title: "Capture the Signals",
    subtitle: "We listen before we prescribe. Days 1–3.",
    bullets: [
      "Stakeholder interviews across every role",
      "Shadow real workflows — not the org chart version",
      "Review existing data, tools, and handoffs",
    ],
    timeNote: "Your time: ~3 hours total",
  },
  {
    icon: Search,
    title: "Trace to the Source",
    subtitle: "Map every breakdown to the real bottleneck. Days 4–7.",
    bullets: [
      "Build a constraint map from interview + observation data",
      "Isolate the single point that throttles throughput",
      "Quantify the cost of inaction with your own numbers",
    ],
    timeNote: "Your time: 0 hours — we do this",
  },
  {
    icon: ClipboardList,
    title: "The 90-Day Fix Plan",
    subtitle: "Prioritized actions, assigned owners, measurable KPIs. Days 8–10.",
    bullets: [
      "3–5 sequenced recommendations, not a laundry list",
      "Each action has an owner, timeline, and success metric",
      "Built around your capacity — not a fantasy roadmap",
    ],
    timeNote: "Your time: 1-hour readout call",
  },
  {
    icon: Sparkles,
    title: "Walk Away With Clarity",
    subtitle: "Three artifacts you'll actually use.",
    bullets: [
      "Root-Cause Constraint Map — see the real bottleneck",
      "Workflow Breakdown Analysis — where time and money leak",
      "90-Day Implementation Plan — what to fix, in what order",
    ],
  },
];

export default function HowClarioWorks() {
  const [activeScene, setActiveScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (index: number, autoplay = true) => {
      clearTimer();
      setActiveScene(index);
      setProgress(0);
      if (autoplay) setIsPlaying(true);
    },
    [clearTimer]
  );

  // Auto-advance timer
  useEffect(() => {
    clearTimer();
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK / SCENE_DURATION) * 100;
        if (next >= 100) {
          setActiveScene((s) => (s + 1) % scenes.length);
          return 0;
        }
        return next;
      });
    }, TICK);

    return clearTimer;
  }, [isPlaying, activeScene, clearTimer]);

  // Touch swipe gestures
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goTo((activeScene + 1) % scenes.length);
      else goTo((activeScene - 1 + scenes.length) % scenes.length);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeScene, goTo]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        goTo((activeScene + 1) % scenes.length);
      } else if (e.key === "ArrowLeft") {
        goTo((activeScene - 1 + scenes.length) % scenes.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeScene, goTo]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.35,
        }}
      />

      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
          <Link to="/get-started">
            <img src={logo} alt="UNBURNT — Clario" className="h-7 opacity-80" />
          </Link>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            How Clario Works
          </span>
        </header>

        {/* Scene area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="relative w-full max-w-2xl min-h-[420px] md:min-h-[460px]">
            {scenes.map((scene, i) => (
              <WalkthroughScene key={i} scene={scene} isActive={i === activeScene} />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-8 w-full">
            <WalkthroughControls
              activeScene={activeScene}
              totalScenes={scenes.length}
              isPlaying={isPlaying}
              progress={progress}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onRestart={() => goTo(0)}
              onPrev={() => goTo((activeScene - 1 + scenes.length) % scenes.length)}
              onNext={() => goTo((activeScene + 1) % scenes.length)}
              onDotClick={(i) => goTo(i)}
            />
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link to="/get-started/configure">
              <Button
                size="lg"
                className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                Find Your Constraint
              </Button>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>Clario™ by UNBURNT</span>
            <span>hello@unburnt.co</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
