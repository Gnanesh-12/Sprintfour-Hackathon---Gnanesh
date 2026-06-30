import { motion } from "framer-motion";
import { CheckCircle2, ShieldAlert, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import type { Span } from "../types";
import { AnimatedButton } from "./ui/AnimatedButton";

interface TrustSummaryPanelProps {
  spans: Span[];
  onExport?: () => void;
}

export default function TrustSummaryPanel({ spans, onExport }: TrustSummaryPanelProps) {
  const total = spans.length;
  const protectedCount = spans.filter(s => s.status === "redacted").length;
  const nearMisses = spans.filter(s => s.status === "nearMiss").length;
  const needsReview = spans.filter(s => s.needsReview).length;
  const score = total === 0 ? 100 : Math.round(((total - needsReview) / total) * 100);

  const scoreColor =
    score >= 95 ? "text-conseal-success" :
    score >= 80 ? "text-conseal-warning" : "text-conseal-danger";

  const items = [
    {
      label: "Automatically Protected",
      value: protectedCount,
      icon: <ShieldCheck className="w-5 h-5 text-conseal-success" />,
      cls: "bg-conseal-success/10 border-conseal-success/20",
      valCls: "text-conseal-success",
    },
    {
      label: "Near Misses Detected",
      value: nearMisses,
      icon: <ShieldAlert className="w-5 h-5 text-conseal-warning" />,
      cls: "bg-conseal-warning/10 border-conseal-warning/20",
      valCls: "text-conseal-warning",
    },
    {
      label: "Require Manual Review",
      value: needsReview,
      icon: <AlertTriangle className="w-5 h-5 text-conseal-danger" />,
      cls: "bg-conseal-danger/10 border-conseal-danger/20",
      valCls: "text-conseal-danger",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 h-full flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-4 border-b border-white/10">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
          className="w-14 h-14 bg-conseal-success/10 rounded-full flex items-center justify-center mb-4 border border-conseal-success/20"
        >
          <CheckCircle2 className="w-7 h-7 text-conseal-success" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-1">Trust Analysis Complete</h2>
        <p className="text-conseal-text-secondary text-center text-xs leading-relaxed">
          Click any entity in the document to inspect its decision.
        </p>
      </div>

      {/* Score + Total */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/[0.02] p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center"
        >
          <span className={`text-4xl font-black ${scoreColor}`}>{score}%</span>
          <span className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mt-1.5">Trust Score</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/[0.02] p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center"
        >
          <span className="text-4xl font-black text-white">{total}</span>
          <span className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mt-1.5">Detected</span>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
            className={`flex items-center justify-between p-3.5 ${item.cls} border rounded-xl`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-semibold text-white">{item.label}</span>
            </div>
            <span className={`text-xl font-bold ${item.valCls}`}>{item.value}</span>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-xl"
        >
          <span className="text-sm font-semibold text-white">Verification Status</span>
          <span className="text-sm font-bold text-conseal-success flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Passed
          </span>
        </motion.div>
      </div>

      {/* Export CTA */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <AnimatedButton
            className="w-full py-3 text-sm font-bold shadow-lg shadow-conseal-primary/20 flex items-center justify-center gap-2"
            onClick={onExport}
          >
            <Download className="w-4 h-4" />
            Export Redacted Document
          </AnimatedButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
