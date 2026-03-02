"use client";

import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";
import type { ReactNode } from "react";

interface AnimatedItemProps {
  children: ReactNode;
}

export function AnimatedItem({ children }: AnimatedItemProps) {
  return <motion.div variants={staggerItem}>{children}</motion.div>;
}
