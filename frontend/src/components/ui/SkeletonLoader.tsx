import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  delay?: number;
}

export function SkeletonLoader({ className, delay = 0 }: SkeletonLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={cn("bg-conseal-border rounded animate-pulse", className)}
    />
  );
}
