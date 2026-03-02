import type { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
