"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label, className }: BackButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl transition-all",
        "text-text-secondary hover:text-text-primary",
        className
      )}
    >
      <motion.div
        whileHover={{ rotate: -5 }}
        className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary border border-border transition-all group-hover:border-[#7C3AED] group-hover:bg-surface group-hover:shadow-lg group-hover:shadow-[#7C3AED]/20"
      >
        <ArrowLeft className="h-5 w-5 text-text-primary" />
      </motion.div>
      {label && (
        <span className="text-sm font-medium hidden sm:inline-block">
          {label}
        </span>
      )}
    </motion.button>
  );
}