import React, { useState, useEffect, useCallback } from 'react';

interface BubbleItem {
  id: number;
  x: number; // percentage (0 - 100)
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  swayAmount: number;
  isSparkle: boolean;
  sparkleSymbol?: string;
  isPopping?: boolean;
}

interface FloatingBubblesProps {
  enabled?: boolean;
}

export const FloatingBubbles: React.FC<FloatingBubblesProps> = ({ enabled = true }) => {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);

  // Sound effect for popping bubble (Web Audio API synth - gentle soft pop)
  const playPopSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Quick pitch slide for a cute pop: 700Hz -> 180Hz
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 150);
    } catch {
      // Audio context might be restricted before interaction; ignore quietly
    }
  }, []);

  // Initialize bubbles on mount with pre-calculated negative delays
  useEffect(() => {
    if (!enabled) {
      setBubbles([]);
      return;
    }

    const sparkleChars = ['✨', '⭐', '💖', '💫', '🌸', '✨'];
    const initialList: BubbleItem[] = [];

    // Create 26 floating bubbles and 14 sparkles
    const totalCount = 40;
    for (let i = 0; i < totalCount; i++) {
      const isSparkle = i % 3 === 0;
      const size = isSparkle
        ? 14 + (i % 4) * 5
        : 18 + (i % 6) * 9 + (i % 2 === 0 ? 8 : 0); // 18px to 65px
      const duration = 10 + (i % 8) * 1.8; // 10s to ~23s
      // Negative delays distribute bubbles across the entire screen right when the page loads
      const delay = -((i * 1.7) % duration);

      initialList.push({
        id: i + 1,
        x: 3 + ((i * 23) % 94), // nicely spaced across width
        size,
        duration,
        delay,
        swayAmount: 12 + (i % 5) * 4,
        isSparkle,
        sparkleSymbol: sparkleChars[i % sparkleChars.length],
        isPopping: false,
      });
    }

    setBubbles(initialList);
  }, [enabled]);

  const handlePop = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();

    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPopping: true } : b))
    );

    // Respawn after pop animation completes
    setTimeout(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            isPopping: false,
            delay: 0,
            x: Math.floor(Math.random() * 90) + 5,
          };
        })
      );
    }, 400);
  };

  if (!enabled || bubbles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none"
    >
      {bubbles.map((b) => {
        if (b.isSparkle) {
          return (
            <div
              key={b.id}
              className="absolute bottom-0 animate-sparkle-drift text-pink-300 drop-shadow-sm flex items-center justify-center pointer-events-none"
              style={{
                left: `${b.x}%`,
                fontSize: `${b.size}px`,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            >
              {b.sparkleSymbol}
            </div>
          );
        }

        return (
          <div
            key={b.id}
            onClick={(e) => handlePop(b.id, e)}
            role="button"
            tabIndex={-1}
            title="แตะเพื่อระเบิดฟองสบู่ ✨"
            className={`absolute bottom-0 rounded-full cursor-pointer pointer-events-auto transition-transform hover:scale-110 active:scale-90 ${
              b.isPopping ? 'animate-bubble-pop' : 'animate-bubble-float'
            }`}
            style={{
              left: `${b.x}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDuration: b.isPopping ? '0.35s' : `${b.duration}s`,
              animationDelay: b.isPopping ? '0s' : `${b.delay}s`,
            }}
          >
            {/* Soap / Foam Bubble Body */}
            <div className="relative w-full h-full rounded-full dreamy-bubble-skin overflow-hidden">
              {/* Top Curved Highlight Arc */}
              <div
                className="absolute rounded-full bg-white/80"
                style={{
                  top: '14%',
                  left: '18%',
                  width: '32%',
                  height: '22%',
                  transform: 'rotate(-35deg)',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Secondary Lower Soft Glow */}
              <div
                className="absolute rounded-full bg-pink-200/50"
                style={{
                  bottom: '12%',
                  right: '16%',
                  width: '26%',
                  height: '18%',
                  filter: 'blur(1px)',
                }}
              />
              {/* Tiny Sparkle Dot */}
              <div
                className="absolute rounded-full bg-white/90"
                style={{
                  top: '32%',
                  left: '14%',
                  width: '10%',
                  height: '10%',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
