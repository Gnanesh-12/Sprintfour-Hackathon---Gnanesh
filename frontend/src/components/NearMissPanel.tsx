import { ShieldAlert, Info } from "lucide-react";
import type { Span } from "../types";
import { ENTITY_LABELS, ENTITY_COLORS } from "../types";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface NearMissPanelProps {
  spans: Span[];
  onSpanSelect?: (span: Span) => void;
  selectedSpanId?: string;
}

export default function NearMissPanel({ spans, onSpanSelect, selectedSpanId }: NearMissPanelProps) {
  if (spans.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center text-conseal-text-secondary">
        <Info className="w-10 h-10 mb-4 opacity-30" />
        <p className="text-base font-semibold text-white mb-2">No Near Misses</p>
        <p className="text-sm">All detected entities were either fully redacted or clearly safe.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-conseal-warning" />
          Near Misses
          <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-conseal-warning/10 text-conseal-warning rounded-full border border-conseal-warning/20">
            {spans.length}
          </span>
        </h2>
        <p className="text-xs text-conseal-text-secondary mt-1">
          Entities kept visible — click to understand why.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
        >
          {spans.map((span) => {
            const color = ENTITY_COLORS[span.type] || "#9CA3AF";
            const isSelected = selectedSpanId === span.id;
            return (
              <motion.button
                key={span.id}
                variants={{ hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0 } }}
                onClick={() => onSpanSelect?.(span)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-all duration-150",
                  isSelected
                    ? "bg-conseal-warning/10 border-conseal-warning/40"
                    : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{span.text}</p>
                    <p className="text-[11px] text-conseal-text-secondary mt-0.5 font-medium">
                      {ENTITY_LABELS[span.type]}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {Math.round(span.confidence * 100)}%
                  </span>
                </div>
                {span.nearMissReason && (
                  <p className="text-[11px] text-conseal-warning mt-2 font-medium">
                    ↳ {span.nearMissReason}
                  </p>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
