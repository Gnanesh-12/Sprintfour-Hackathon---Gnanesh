import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
}

export function AnimatedCard({ className, hoverEffect = true, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, boxShadow: "0px 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("bg-conseal-card border border-conseal-border rounded-xl shadow-sm p-6 overflow-hidden relative", className)}
      {...props}
    />
  );
}
