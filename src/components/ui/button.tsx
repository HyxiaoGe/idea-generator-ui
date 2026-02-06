"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7C3AED]/50",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-[#7C3AED]/30 hover:shadow-xl hover:shadow-[#7C3AED]/40 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg shadow-[#EF4444]/30 hover:shadow-xl hover:shadow-[#EF4444]/40 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "rounded-xl border border-border bg-transparent text-text-primary hover:bg-surface hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/20 active:scale-[0.98]",
        secondary:
          "rounded-xl bg-surface-secondary text-text-primary border border-border hover:bg-surface hover:border-border-hover active:scale-[0.98]",
        ghost:
          "rounded-xl text-text-secondary hover:bg-surface-secondary hover:text-text-primary active:scale-[0.98]",
        link: "text-[#7C3AED] underline-offset-4 hover:underline hover:text-[#2563EB]",
        success:
          "rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/30 hover:shadow-xl hover:shadow-[#10B981]/40 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-lg px-3 py-1.5 text-xs",
        lg: "h-12 rounded-xl px-7 py-3 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
