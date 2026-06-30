import { motion } from "framer-motion";
import { useReviewContext } from "../context/ReviewContext";
import { ReviewCard } from "./ReviewCard";
import type { Span } from "../types";

interface ReviewPanelProps {
  onSpanSelect?: (span: Span) => void;
  selectedSpanId?: string;
}

export default function ReviewPanel({ onSpanSelect, selectedSpanId }: ReviewPanelProps) {
  const { spans } = useReviewContext();

  const recommendedRedactions = spans.filter(s => (s.originalDecision || s.status) === "redacted" && !s.needsReview);
  const recommendedNearMisses = spans.filter(s => (s.originalDecision || s.status) === "nearMiss" && !s.needsReview);
  const needsReview = spans.filter(s => s.needsReview);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  };

  const renderSection = (title: string, data: Span[]) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold text-conseal-text-secondary uppercase tracking-wider mb-4 border-b border-conseal-border pb-2">
          {title} <span className="ml-2 bg-conseal-card px-2 py-0.5 rounded-full text-xs">{data.length}</span>
        </h3>
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
          {data.map(span => (
            <motion.div key={span.id} variants={item}>
              <ReviewCard 
                span={span} 
                onSelect={() => onSpanSelect?.(span)}
                isSelected={selectedSpanId === span.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-hide">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Review Workflow</h2>
        <p className="text-sm text-conseal-text-secondary mt-1">Audit and override AI decisions before exporting.</p>
      </div>

      {renderSection("Needs Review", needsReview)}
      {renderSection("AI Recommended Redactions", recommendedRedactions)}
      {renderSection("AI Recommended Near Misses", recommendedNearMisses)}
    </div>
  );
}
