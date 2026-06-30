/**
 * NearMissToggle – The app's signature feature.
 *
 * Toggle switch that reveals every entity the system intentionally
 * left visible. Includes a count badge and summary explanation.
 */

import type { Span } from "../types";
import { ENTITY_LABELS, ENTITY_COLORS } from "../types";

interface NearMissToggleProps {
  spans: Span[];
  showNearMisses: boolean;
  onToggle: () => void;
}

export default function NearMissToggle({
  spans,
  showNearMisses,
  onToggle,
}: NearMissToggleProps) {
  const nearMisses = spans.filter((s) => s.status === "nearMiss");
  const count = nearMisses.length;

  // Group by type for the summary
  const byType = nearMisses.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              Show Near Misses
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Entities the system considered but chose not to redact
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Count badge */}
          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            {count}
          </span>

          {/* Toggle switch */}
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              showNearMisses ? "bg-indigo-600" : "bg-gray-700"
            }`}
            role="switch"
            aria-checked={showNearMisses}
            aria-label="Toggle near-miss highlights"
            id="near-miss-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                showNearMisses ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded summary when toggled on */}
      {showNearMisses && count > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-slide-in-up">
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            The system detected these entities but <strong className="text-gray-300">deliberately chose not to redact them</strong>.
            Each one has a specific reason for remaining visible.
          </p>

          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, typeCount]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: `${ENTITY_COLORS[type as keyof typeof ENTITY_COLORS]}15`,
                  color: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS],
                  border: `1px solid ${ENTITY_COLORS[type as keyof typeof ENTITY_COLORS]}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS] }}
                ></span>
                {typeCount} {ENTITY_LABELS[type as keyof typeof ENTITY_LABELS]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
