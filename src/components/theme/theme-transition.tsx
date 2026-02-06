"use client";

import { useEffect, useRef } from "react";

interface ThemeTransitionFluidProps {
  isTransitioning: boolean;
  fromTheme: "light" | "dark";
  toTheme: "light" | "dark";
  onComplete: () => void;
  triggerPosition?: { x: number; y: number };
}

export function ThemeTransitionFluid({
  isTransitioning,
  toTheme,
  onComplete,
}: ThemeTransitionFluidProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasAppliedThemeRef = useRef(false);

  useEffect(() => {
    if (!isTransitioning) {
      hasAppliedThemeRef.current = false;
      return;
    }

    const duration = 400;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 0.5 && !hasAppliedThemeRef.current) {
        hasAppliedThemeRef.current = true;
        const root = document.documentElement;
        root.setAttribute("data-theme", toTheme);
        if (toTheme === "dark") {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.add("light");
          root.classList.remove("dark");
        }
      }

      let opacity;
      if (progress < 0.5) {
        opacity = progress * 2 * 0.3;
      } else {
        opacity = (1 - progress) * 2 * 0.3;
      }

      if (overlayRef.current) {
        overlayRef.current.style.opacity = opacity.toString();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    }

    animate();
  }, [isTransitioning, toTheme, onComplete]);

  if (!isTransitioning) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[9999] bg-black"
      style={{ opacity: 0 }}
    />
  );
}
