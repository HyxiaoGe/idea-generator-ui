"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "default" | "ghost" | "outline" | "danger" | "success";
  size?: "sm" | "default" | "lg";
}

const variantStyles = {
  default:
    "bg-surface-secondary border border-border text-text-primary hover:bg-surface hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20",
  ghost: "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-surface hover:border-[#7C3AED]",
  danger: "text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444]",
  success: "text-[#10B981] hover:bg-[#10B981]/10 hover:text-[#10B981]",
};

const sizeStyles = {
  sm: "size-8 rounded-lg",
  default: "size-10 rounded-xl",
  lg: "size-12 rounded-xl",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "inline-flex items-center justify-center transition-all",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50 focus-visible:outline-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";
