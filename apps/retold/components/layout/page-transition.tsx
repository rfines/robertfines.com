"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
  hidden: { opacity: 0, y: 4 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
