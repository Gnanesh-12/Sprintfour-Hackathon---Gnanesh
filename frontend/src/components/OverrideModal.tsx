import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldOff, Eye } from "lucide-react";
import type { Span, SpanStatus } from "../types";
import { ENTITY_LABELS } from "../types";
import { useReviewContext } from "../context/ReviewContext";
import { AnimatedButton } from "./ui/AnimatedButton";
import { cn } from "../lib/utils";

const OVERRIDE_REASONS = [
  "False Positive",
  "Public Information",
  "Intentional Disclosure",
  "Other",
];

interface OverrideModalProps {
  span: Span;
  onClose: () => void;
}

export default function OverrideModal({ span, onClose }: OverrideModalProps) {
  const { overrideDecision } = useReviewContext();
  const [newDecision, setNewDecision] = useState<SpanStatus>(
    span.status === "redacted" ? "nearMiss" : "redacted"
  );
  const [reason, setReason] = useState(OVERRIDE_REASONS[0]);

  const handleSave = () => {
    overrideDecision(span.id, newDecision, reason);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white">Override Decision</h2>
              <p className="text-xs text-conseal-text-secondary mt-0.5">
                {ENTITY_LABELS[span.type]} · <span className="font-mono">{span.text}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-conseal-text-secondary hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Decision */}
            <div>
              <p className="text-xs font-bold text-conseal-text-secondary uppercase tracking-wider mb-2">Current Decision</p>
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-sm font-semibold",
                span.status === "redacted"
                  ? "bg-conseal-success/10 border-conseal-success/20 text-conseal-success"
                  : "bg-conseal-warning/10 border-conseal-warning/20 text-conseal-warning"
              )}>
                {span.status === "redacted" ? <ShieldOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {span.status === "redacted" ? "Redacted" : "Kept Visible (Near Miss)"}
              </div>
            </div>

            {/* New Decision */}
            <div>
              <p className="text-xs font-bold text-conseal-text-secondary uppercase tracking-wider mb-2">New Decision</p>
              <div className="grid grid-cols-2 gap-2">
                {(["redacted", "nearMiss"] as SpanStatus[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setNewDecision(d)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-all",
                      newDecision === d
                        ? d === "redacted"
                          ? "bg-conseal-success/20 border-conseal-success text-conseal-success"
                          : "bg-conseal-warning/20 border-conseal-warning text-conseal-warning"
                        : "border-white/10 text-conseal-text-secondary hover:border-white/20 hover:text-white"
                    )}
                  >
                    {d === "redacted" ? <ShieldOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {d === "redacted" ? "Redact" : "Keep Visible"}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs font-bold text-conseal-text-secondary uppercase tracking-wider mb-2">Reason</p>
              <div className="space-y-2">
                {OVERRIDE_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition-all text-left",
                      reason === r
                        ? "bg-conseal-primary/10 border-conseal-primary/40 text-white"
                        : "border-white/10 text-conseal-text-secondary hover:border-white/20 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors",
                      reason === r ? "border-conseal-primary bg-conseal-primary" : "border-white/30"
                    )} />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-conseal-text-secondary hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <AnimatedButton onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold">
              Save Override
            </AnimatedButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
