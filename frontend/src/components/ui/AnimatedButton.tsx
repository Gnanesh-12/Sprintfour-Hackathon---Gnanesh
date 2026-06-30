import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function AnimatedButton({ className, variant = "primary", ...props }: AnimatedButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-conseal-primary text-white hover:bg-blue-600 disabled:opacity-50",
    secondary: "bg-conseal-card text-white border border-conseal-border hover:bg-gray-800 disabled:opacity-50",
    danger: "bg-conseal-danger text-white hover:bg-red-600 disabled:opacity-50",
    ghost: "text-conseal-text-secondary hover:text-white hover:bg-conseal-card disabled:opacity-50"
  };

  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.03 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
}
