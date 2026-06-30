import { Check, ShieldOff, Eye, ArrowRight } from "lucide-react";
import type { Span } from "../types";
import { useReviewContext } from "../context/ReviewContext";
import { ENTITY_LABELS, ENTITY_COLORS } from "../types";
import { cn } from "../lib/utils";
import { AnimatedButton } from "./ui/AnimatedButton";
import { AnimatedCard } from "./ui/AnimatedCard";

interface ReviewCardProps {
  span: Span;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function ReviewCard({ span, onSelect, isSelected }: ReviewCardProps) {
  const { overrideDecision, acceptDecision } = useReviewContext();

  const original = span.originalDecision || span.status;

  const handleKeepRedacted = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (original === "redacted") {
      acceptDecision(span.id);
    } else {
      overrideDecision(span.id, "redacted", "User explicitly decided to redact.");
    }
  };

  const handleKeepVisible = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (original === "nearMiss") {
      acceptDecision(span.id);
    } else {
      overrideDecision(span.id, "nearMiss", "User explicitly decided to keep visible.");
    }
  };

  return (
    <AnimatedCard
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-3 p-4 border border-conseal-border bg-conseal-card/50 transition-colors cursor-pointer",
        isSelected && "ring-2 ring-conseal-primary bg-conseal-card"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-white text-lg">{span.text}</h4>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ backgroundColor: `${ENTITY_COLORS[span.type]}20`, color: ENTITY_COLORS[span.type] }}
          >
            {ENTITY_LABELS[span.type]}
          </span>
        </div>

        {span.isOverridden ? (
          <span className="text-xs font-bold px-2 py-1 bg-conseal-warning/20 text-conseal-warning rounded-full border border-conseal-warning/30 flex items-center gap-1">
            <ShieldOff className="w-3 h-3" /> User Override
          </span>
        ) : span.reviewStatus === "accepted" ? (
          <span className="text-xs font-bold px-2 py-1 bg-conseal-success/20 text-conseal-success rounded-full border border-conseal-success/30 flex items-center gap-1">
            <Check className="w-3 h-3" /> Accepted
          </span>
        ) : span.needsReview ? (
          <span className="text-xs font-bold px-2 py-1 bg-conseal-danger/20 text-conseal-danger rounded-full border border-conseal-danger/30">
            Needs Review
          </span>
        ) : (
          <span className="text-xs font-bold px-2 py-1 bg-conseal-primary/20 text-conseal-primary rounded-full border border-conseal-primary/30">
            AI Recommended
          </span>
        )}
      </div>

      <div className="text-sm text-conseal-text-secondary mt-1">
        <p><strong className="text-conseal-text-primary">Confidence:</strong> {Math.round(span.confidence * 100)}% ({span.confidenceLevel})</p>
        <p><strong className="text-conseal-text-primary">Reason:</strong> {span.rationale}</p>
        <p><strong className="text-conseal-text-primary">Recommendation:</strong> {span.recommendation || (original === "redacted" ? "Redact" : "Keep Visible")}</p>
      </div>

      {span.isOverridden && (
        <div className="mt-2 p-3 bg-conseal-bg/50 rounded-lg text-xs border border-conseal-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-conseal-text-secondary">
            <span className="font-semibold text-conseal-text-primary">AI:</span>
            {original === "redacted" ? "Redact" : "Visible"}
            <ArrowRight className="w-3 h-3" />
            <span className="font-semibold text-conseal-text-primary">User:</span>
            <span className={span.status === "redacted" ? "text-conseal-success" : "text-conseal-warning"}>
              {span.status === "redacted" ? "Redact" : "Visible"}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2 pt-3 border-t border-conseal-border/50">
        <AnimatedButton
          variant={span.status === "redacted" ? "primary" : "ghost"}
          onClick={handleKeepRedacted}
          className={cn("flex-1 text-xs py-2", span.status === "redacted" && "bg-conseal-success hover:bg-conseal-success/90")}
        >
          <Check className="w-3 h-3" />
          {original === "redacted" ? "Keep Redacted" : "Redact Anyway"}
        </AnimatedButton>
        <AnimatedButton
          variant={span.status === "nearMiss" ? "primary" : "ghost"}
          onClick={handleKeepVisible}
          className={cn("flex-1 text-xs py-2", span.status === "nearMiss" && "bg-conseal-warning hover:bg-conseal-warning/90")}
        >
          <Eye className="w-3 h-3" />
          {original === "nearMiss" ? "Keep Visible" : "Keep Visible"}
        </AnimatedButton>
      </div>
    </AnimatedCard>
  );
}
