import { useState } from "react";
import { ShieldAlert, CheckCircle, Info, ShieldOff, Eye, Edit3 } from "lucide-react";
import type { Span } from "../types";
import { ENTITY_LABELS, RISK_COLORS, getRiskLevel } from "../types";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import OverrideModal from "./OverrideModal";

interface ExplanationPanelProps {
  span: Span | null;
  onClose: () => void;
}

export default function ExplanationPanel({ span }: ExplanationPanelProps) {
  const [showOverride, setShowOverride] = useState(false);

  if (!span) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center text-conseal-text-secondary">
        <Info className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-base font-semibold text-white mb-2">No entity selected</p>
        <p className="text-sm leading-relaxed">Click any highlighted entity in the document to inspect its decision.</p>
      </div>
    );
  }

  const isNearMiss = span.status === "nearMiss";
  const entityLabel = ENTITY_LABELS[span.type] || "Other";
  const riskLevel = span.risk?.toLowerCase() || getRiskLevel(span.type);
  const riskColor = RISK_COLORS[riskLevel] || RISK_COLORS.low;

  return (
    <>
      <motion.div
        key={span.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="p-6 h-full flex flex-col gap-5 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start gap-3 pb-5 border-b border-white/10">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isNearMiss ? "bg-conseal-warning/10" : "bg-conseal-success/10"
          )}>
            {isNearMiss
              ? <ShieldAlert className="w-5 h-5 text-conseal-warning" />
              : <CheckCircle className="w-5 h-5 text-conseal-success" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-conseal-text-secondary uppercase tracking-wider mb-1">
              {entityLabel}
            </p>
            <h2 className="text-lg font-bold text-white truncate">{span.text}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                isNearMiss
                  ? "bg-conseal-warning/20 text-conseal-warning border-conseal-warning/30"
                  : "bg-conseal-success/20 text-conseal-success border-conseal-success/30"
              )}>
                {isNearMiss ? "Near Miss" : "Redacted"}
              </span>
              {span.isOverridden && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-conseal-primary/20 text-conseal-primary rounded-full border border-conseal-primary/30">
                  User Override
                </span>
              )}
              {span.needsReview && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-conseal-danger/20 text-conseal-danger rounded-full border border-conseal-danger/30">
                  Needs Review
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confidence + Risk */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/10">
            <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mb-1">Confidence</p>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-bold text-white">{Math.round(span.confidence * 100)}%</span>
              <span className="text-xs text-conseal-text-secondary mb-0.5">{span.confidenceLevel || "High"}</span>
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${span.confidence * 100}%` }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: riskColor }}
              />
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/10">
            <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mb-1">Risk Level</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: riskColor }} />
              <span className="text-base font-bold text-white capitalize">{riskLevel}</span>
            </div>
          </div>
        </div>

        {/* Decision + Recommendation */}
        <div className="space-y-1">
          <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold">Decision</p>
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg border text-sm font-semibold",
            isNearMiss
              ? "bg-conseal-warning/10 border-conseal-warning/20 text-conseal-warning"
              : "bg-conseal-success/10 border-conseal-success/20 text-conseal-success"
          )}>
            {isNearMiss ? <Eye className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            {isNearMiss ? "Kept Visible – Low Risk" : "Redacted – Sensitive Information"}
          </div>
        </div>

        {/* Rationale */}
        <div className="space-y-1">
          <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Info className="w-3 h-3" /> Reason
          </p>
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/10">
            <p className="text-sm leading-relaxed text-conseal-text">{span.rationale}</p>
            {isNearMiss && span.nearMissReason && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-xs font-bold text-conseal-warning">Why Kept Visible: </span>
                <span className="text-xs text-conseal-text-secondary">{span.nearMissReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recognizer */}
        <div className="space-y-1">
          <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold">Recognizer</p>
          <code className="block text-xs bg-black/40 px-3 py-2 rounded-lg text-conseal-primary border border-white/10 font-mono">
            {span.matchedRecognizer}
          </code>
        </div>

        {/* Verification */}
        <div className="space-y-1">
          <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold">Verification</p>
          <div className="space-y-1.5">
            {[
              { label: "Original value removed", done: span.status === "redacted" },
              { label: "Placeholder inserted", done: span.status === "redacted" },
              { label: "Export verified", done: span.status === "redacted" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm">
                <div className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                  item.done ? "bg-conseal-success/20 text-conseal-success" : "bg-white/10 text-conseal-text-secondary"
                )}>
                  {item.done ? "✓" : "–"}
                </div>
                <span className={item.done ? "text-white" : "text-conseal-text-secondary"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Override Button */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <button
            onClick={() => setShowOverride(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-conseal-text-secondary hover:text-white hover:border-conseal-primary/50 hover:bg-conseal-primary/5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Override Decision
          </button>
        </div>
      </motion.div>

      {showOverride && (
        <OverrideModal span={span} onClose={() => setShowOverride(false)} />
      )}
    </>
  );
}
