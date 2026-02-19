"use client";

import { motion, AnimatePresence } from "motion/react";

interface CollapsibleParamsProps {
  open: boolean;
  children: React.ReactNode;
}

export function CollapsibleParams({ open, children }: CollapsibleParamsProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="border-border bg-surface mb-4 rounded-2xl border p-6">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
