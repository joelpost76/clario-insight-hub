import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SceneData {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bullets: string[];
  timeNote?: string;
}

interface WalkthroughSceneProps {
  scene: SceneData;
  isActive: boolean;
}

export function WalkthroughScene({ scene, isActive }: WalkthroughSceneProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(isActive);
  const [bulletReveal, setBulletReveal] = useState<boolean[]>([]);
  const [timeNoteVisible, setTimeNoteVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
      const enterTimer = setTimeout(() => setVisible(true), 50);

      const bulletTimers = scene.bullets.map((_, i) =>
        setTimeout(() => {
          setBulletReveal((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 600 + i * 200)
      );

      const timeTimer = setTimeout(
        () => setTimeNoteVisible(true),
        600 + scene.bullets.length * 200 + 300
      );

      return () => {
        clearTimeout(enterTimer);
        bulletTimers.forEach(clearTimeout);
        clearTimeout(timeTimer);
      };
    } else {
      setVisible(false);
      setBulletReveal([]);
      setTimeNoteVisible(false);
      const unmountTimer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(unmountTimer);
    }
  }, [isActive, scene.bullets.length]);

  if (!mounted && !isActive) return null;

  const Icon = scene.icon;

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-500 ease-in-out",
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98] pointer-events-none"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-6 transition-all duration-500 delay-100",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.8]"
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h2
        className={cn(
          "text-2xl md:text-3xl font-bold text-foreground mb-2 transition-all duration-500 delay-200",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}
      >
        {scene.title}
      </h2>

      {/* Subtitle */}
      <p
        className={cn(
          "text-muted-foreground text-base md:text-lg max-w-lg mb-8 transition-all duration-500 delay-300",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}
      >
        {scene.subtitle}
      </p>

      {/* Bullets */}
      <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
        {scene.bullets.map((bullet, i) => (
          <li
            key={i}
            className={cn(
              "flex items-start gap-3 transition-all duration-300",
              bulletReveal[i] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
            )}
          >
            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-foreground/90 text-sm md:text-base">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Time note */}
      {scene.timeNote && (
        <p
          className={cn(
            "text-xs md:text-sm font-medium text-primary/80 tracking-wide uppercase transition-all duration-500",
            timeNoteVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {scene.timeNote}
        </p>
      )}
    </div>
  );
}
