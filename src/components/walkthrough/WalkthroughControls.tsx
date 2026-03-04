import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalkthroughControlsProps {
  activeScene: number;
  totalScenes: number;
  isPlaying: boolean;
  progress: number;
  finished: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (index: number) => void;
}

export function WalkthroughControls({
  activeScene,
  totalScenes,
  isPlaying,
  progress,
  finished,
  onTogglePlay,
  onRestart,
  onPrev,
  onNext,
  onDotClick,
}: WalkthroughControlsProps) {
  const overallProgress = finished
    ? 100
    : ((activeScene + progress / 100) / totalScenes) * 100;

  const isFirst = activeScene === 0;
  const isLast = activeScene === totalScenes - 1;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="relative h-1 bg-border rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-200 ease-linear"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: totalScenes }).map((_, i) => (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              i === activeScene
                ? "bg-primary scale-125"
                : i < activeScene
                ? "bg-primary/40"
                : "bg-border"
            )}
            aria-label={`Go to scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <div className="flex items-center gap-2">
          {finished ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestart}
              className="text-primary hover:text-primary/80 gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePlay}
                className="text-muted-foreground hover:text-foreground"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRestart}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={isLast}
          className="text-muted-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
