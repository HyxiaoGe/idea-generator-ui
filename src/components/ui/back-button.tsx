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
        className="bg-surface-secondary border-border group-hover:bg-surface flex size-10 items-center justify-center rounded-xl border transition-all group-hover:border-[#7C3AED] group-hover:shadow-lg group-hover:shadow-[#7C3AED]/20"
      >
        <ArrowLeft className="text-text-primary h-5 w-5" />
      </motion.div>
      {label && <span className="hidden text-sm font-medium sm:inline-block">{label}</span>}
    </motion.button>
  );
}
