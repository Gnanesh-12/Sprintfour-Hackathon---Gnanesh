/**
 * ReviewQueue – Surfaces uncertain decisions for human review.
 *
 * Filters spans where needsReview === true (confidence < 0.70).
 * Shows entity text, confidence %, reason for uncertainty,
 * and recommendation. Accept/Reject actions per item.
 */

import { useState } from "react";
import type { Span } from "../types";
import { ENTITY_LABELS, ENTITY_COLORS } from "../types";

interface ReviewQueueProps {
  spans: Span[];
  onSpanClick: (span: Span) => void;
}

export default function ReviewQueue({ spans, onSpanClick }: ReviewQueueProps) {
  const reviewableSpans = spans.filter((s) => s.needsReview);
  const [decisions, setDecisions] = useState<
    Record<string, "accepted" | "rejected">
  >({});

  const pendingCount = reviewableSpans.filter(
    (s) => !decisions[s.id]
  ).length;

  const handleDecision = (
    spanId: string,
    decision: "accepted" | "rejected"
  ) => {
    setDecisions((prev) => ({ ...prev, [spanId]: decision }));
  };

  if (reviewableSpans.length === 0) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-200">Review Queue</h2>
        </div>
        <p className="text-sm text-gray-400">
          All detections have sufficient confidence. No items need manual review.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-200">Review Queue</h2>
        </div>
        <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
          {pendingCount} pending
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        These entities were detected with
        <strong className="text-gray-300"> moderate confidence</strong>.
        The system is openly admitting uncertainty — please verify each decision.
      </p>

      {/* Review cards */}
      <div className="space-y-3">
        {reviewableSpans.map((span) => {
          const decision = decisions[span.id];
          const confidencePercent = Math.round(span.confidence * 100);
          const entityColor = ENTITY_COLORS[span.type];

          return (
            <div
              key={span.id}
              className={`glass-card-sm p-4 transition-all duration-300 ${
                decision === "accepted"
                  ? "border-emerald-500/30 opacity-60"
                  : decision === "rejected"
                  ? "border-red-500/30 opacity-60"
                  : "hover:border-white/10"
              }`}
            >
              {/* Top row: entity info */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSpanClick(span)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: entityColor }}
                  ></span>
                  <span className="font-mono text-sm font-semibold" style={{ color: entityColor }}>
                    {span.text}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {ENTITY_LABELS[span.type]}
                </span>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Confidence</span>
                <div className="confidence-bar flex-1">
                  <div
                    className="confidence-fill"
                    style={{
                      width: `${confidencePercent}%`,
                      background: "linear-gradient(90deg, #eab308, #ca8a04)",
                    }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-amber-400 w-8 text-right">
                  {confidencePercent}%
                </span>
              </div>

              {/* Reason */}
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                {span.rationale}
              </p>

              {/* Recommendation */}
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">
                  Recommendation: Manual Review
                </span>
              </div>

              {/* Action buttons */}
              {!decision ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(span.id, "accepted")}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    ✓ Accept Redaction
                  </button>
                  <button
                    onClick={() => handleDecision(span.id, "rejected")}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    ✕ Reject — Keep Visible
                  </button>
                </div>
              ) : (
                <div
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-center ${
                    decision === "accepted"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {decision === "accepted"
                    ? "✓ Redaction Accepted"
                    : "✕ Redaction Rejected — Kept Visible"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
