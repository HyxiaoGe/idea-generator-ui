"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { ThemeTransitionFluid } from "./theme-transition";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleThemeWithAnimation: (triggerPosition?: { x: number; y: number }) => void;
}

const ThemeAnimationContext = createContext<{
  toggleThemeWithAnimation: (triggerPosition?: { x: number; y: number }) => void;
} | null>(null);

function ThemeAnimationProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState<{
    fromTheme: Theme;
    toTheme: Theme;
    triggerPosition?: { x: number; y: number };
  } | null>(null);

  const currentTheme = (resolvedTheme || theme || "dark") as Theme;

  const toggleThemeWithAnimation = useCallback(
    (triggerPosition?: { x: number; y: number }) => {
      const newTheme: Theme = currentTheme === "light" ? "dark" : "light";

      setTransitionConfig({
        fromTheme: currentTheme,
        toTheme: newTheme,
        triggerPosition,
      });
      setIsTransitioning(true);
    },
    [currentTheme]
  );

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    if (transitionConfig) {
      setTheme(transitionConfig.toTheme);
    }
    setTransitionConfig(null);
  }, [transitionConfig, setTheme]);

  return (
    <ThemeAnimationContext.Provider value={{ toggleThemeWithAnimation }}>
      {children}
      {transitionConfig && (
        <ThemeTransitionFluid
          isTransitioning={isTransitioning}
          fromTheme={transitionConfig.fromTheme}
          toTheme={transitionConfig.toTheme}
          onComplete={handleTransitionComplete}
          triggerPosition={transitionConfig.triggerPosition}
        />
      )}
    </ThemeAnimationContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ThemeAnimationProvider>{children}</ThemeAnimationProvider>
    </NextThemesProvider>
  );
}

export function useTheme(): ThemeContextType {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const animationContext = useContext(ThemeAnimationContext);

  const currentTheme = (resolvedTheme || theme || "dark") as Theme;

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  }, [currentTheme, setTheme]);

  const toggleThemeWithAnimation = useCallback(
    (triggerPosition?: { x: number; y: number }) => {
      if (animationContext) {
        animationContext.toggleThemeWithAnimation(triggerPosition);
      } else {
        toggleTheme();
      }
    },
    [animationContext, toggleTheme]
  );

  return {
    theme: currentTheme,
    setTheme: setTheme as (theme: Theme) => void,
    toggleTheme,
    toggleThemeWithAnimation,
  };
}
