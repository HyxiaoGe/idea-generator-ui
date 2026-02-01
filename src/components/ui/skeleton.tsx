"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text" | "button" | "tag";
  animate?: boolean;
  delay?: number;
}

export function Skeleton({
  className,
  variant = "default",
  animate = true,
  delay = 0,
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-surface-secondary overflow-hidden relative";
  
  const variantClasses = {
    default: "rounded-xl",
    circle: "rounded-full",
    text: "rounded",
    button: "rounded-lg",
    tag: "rounded-full",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
        />
      )}
    </div>
  );
}

// Shimmer container for wave effect
export function SkeletonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

// Text skeleton with multiple lines
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-4/5", "w-3/5"];
  
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn("h-4", widths[i % widths.length])}
          delay={i * 0.1}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton
      variant="circle"
      className={cn(sizeClasses[size], className)}
    />
  );
}

// Button skeleton
export function SkeletonButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton
      variant="button"
      className={cn("h-10 w-24", className)}
    />
  );
}

// Tag skeleton
export function SkeletonTag({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <Skeleton
      variant="tag"
      className={cn("h-6 w-16", className)}
      delay={delay}
    />
  );
}