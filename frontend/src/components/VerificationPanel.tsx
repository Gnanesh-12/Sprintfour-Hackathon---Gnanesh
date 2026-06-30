import { CheckCircle2, ShieldCheck, Download, AlertTriangle, Circle } from "lucide-react";
import type { Span } from "../types";
import { verifyDocument } from "../api";
import { useEffect, useState } from "react";
import type { VerifyResponse } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedButton } from "./ui/AnimatedButton";
import { cn } from "../lib/utils";

interface VerificationPanelProps {
  documentText: string;
  spans: Span[];
  onExport?: () => void;
}

const CHECKLIST = [
  { key: "removed", label: "Original value removed" },
  { key: "placeholder", label: "Placeholder inserted" },
  { key: "export", label: "Export verified" },
  { key: "share", label: "Ready to share" },
];

export default function VerificationPanel({ documentText, spans, onExport }: VerificationPanelProps) {
  const [verification, setVerification] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        setCheckedItems([]);
        const result = await verifyDocument(documentText, spans);
        if (!active) return;
        setVerification(result);
        // Animate checklist items in with a staggered delay
        if (result.allPassed) {
          CHECKLIST.forEach((item, i) => {
            setTimeout(() => {
              setCheckedItems(prev => [...prev, item.key]);
            }, 300 + i * 350);
          });
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [documentText, spans]);

  const redactedCount = spans.filter(s => s.status === "redacted").length;
  const overrideCount = spans.filter(s => s.isOverridden).length;

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-conseal-primary border-t-transparent rounded-full"
        />
        <p className="text-base font-semibold text-white">Verifying Redactions...</p>
        <p className="text-sm text-conseal-text-secondary">Mechanically checking every decision.</p>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center text-conseal-danger gap-4">
        <AlertTriangle className="w-10 h-10" />
        <p className="text-base font-semibold">Verification Failed</p>
        <p className="text-sm text-conseal-text-secondary">{error || "Could not complete verification."}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-conseal-success" />
          Verification
        </h2>
        <p className="text-xs text-conseal-text-secondary mt-1">
          Mechanical proof that sensitive data is actually removed.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/10 text-center">
            <p className="text-2xl font-bold text-conseal-success">{redactedCount}</p>
            <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mt-1">Redacted</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/10 text-center">
            <p className="text-2xl font-bold text-conseal-warning">{overrideCount}</p>
            <p className="text-[10px] text-conseal-text-secondary uppercase tracking-wider font-bold mt-1">Overrides</p>
          </div>
        </div>

        {/* Animated Checklist */}
        <div className="space-y-2">
          {CHECKLIST.map((item) => {
            const done = checkedItems.includes(item.key);
            const failed = !verification.allPassed && item.key === "export";
            return (
              <motion.div
                key={item.key}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300",
                  done && !failed ? "bg-conseal-success/10 border-conseal-success/20" :
                  failed ? "bg-conseal-danger/10 border-conseal-danger/20" :
                  "bg-white/[0.02] border-white/10"
                )}
              >
                <AnimatePresence mode="wait">
                  {done && !failed ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.6 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-conseal-success flex-shrink-0" />
                    </motion.div>
                  ) : failed ? (
                    <AlertTriangle className="w-5 h-5 text-conseal-danger flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/20 flex-shrink-0" />
                  )}
                </AnimatePresence>
                <span className={cn(
                  "text-sm font-semibold",
                  done && !failed ? "text-white" : failed ? "text-conseal-danger" : "text-conseal-text-secondary"
                )}>
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: checkedItems.length === 4 ? 1 : 0, y: checkedItems.length === 4 ? 0 : 10 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "rounded-xl p-4 text-center border",
            verification.allPassed
              ? "bg-conseal-success/10 border-conseal-success/20"
              : "bg-conseal-danger/10 border-conseal-danger/20"
          )}
        >
          {verification.allPassed ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-conseal-success mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Document Safe to Share</p>
              <p className="text-xs text-conseal-text-secondary mt-1">All PII mechanically removed.</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8 text-conseal-danger mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Verification Issues Found</p>
              <p className="text-xs text-conseal-text-secondary mt-1">Some PII may remain. Do not export.</p>
            </>
          )}
        </motion.div>

        <AnimatedButton
          className="w-full py-3.5 text-sm font-bold shadow-lg shadow-conseal-primary/20 flex items-center justify-center gap-2"
          disabled={!verification.allPassed}
          onClick={() => onExport?.()}
        >
          <Download className="w-4 h-4" />
          Export Safe Document
        </AnimatedButton>
      </div>
    </div>
  );
}
