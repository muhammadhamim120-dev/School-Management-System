"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating action button — glass, glowing, spring-animated. Sits bottom-right,
 * above content. Purely presentational; wire onClick to any action.
 */
export function FloatingActionButton({
  onClick, icon: Icon = Plus, label, className,
}: { onClick?: () => void; icon?: LucideIcon; label?: string; className?: string }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.3 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "glow fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-primary-foreground shadow-float",
        label ? "pr-6" : "",
        className
      )}
      aria-label={label ?? "Action"}
    >
      <Icon className="h-5 w-5" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </motion.button>
  );
}
