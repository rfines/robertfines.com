"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function RevealOnScroll({
  children,
  className,
  delay = 0,
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
