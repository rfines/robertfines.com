"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {children}
    </motion.div>
  );
}
