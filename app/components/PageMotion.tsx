"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// ponytail: skips reduced/off anim check — all pages use same transition, fast enough to not need it
export default function PageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
