import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Span, SpanStatus } from "../types";

interface ReviewContextType {
  spans: Span[];
  setSpans: React.Dispatch<React.SetStateAction<Span[]>>;
  overrideDecision: (spanId: string, newDecision: SpanStatus, reason?: string) => void;
  acceptDecision: (spanId: string) => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children, initialSpans }: { children: ReactNode; initialSpans: Span[] }) {
  const [spans, setSpans] = useState<Span[]>(
    initialSpans.map(span => ({
      ...span,
      originalDecision: span.originalDecision || span.status,
      reviewStatus: span.reviewStatus || "pending",
      isOverridden: span.isOverridden || false
    }))
  );

  const overrideDecision = (spanId: string, newDecision: SpanStatus, reason?: string) => {
    setSpans(prev => prev.map(span => {
      if (span.id !== spanId) return span;

      const original = span.originalDecision || span.status;
      const isOverridden = newDecision !== original;

      return {
        ...span,
        status: newDecision,
        userDecision: newDecision,
        isOverridden,
        overrideReason: reason || span.overrideReason,
        reviewStatus: isOverridden ? "overridden" : "accepted"
      };
    }));
  };

  const acceptDecision = (spanId: string) => {
    setSpans(prev => prev.map(span => {
      if (span.id !== spanId) return span;
      return {
        ...span,
        reviewStatus: "accepted"
      };
    }));
  };

  return (
    <ReviewContext.Provider value={{ spans, setSpans, overrideDecision, acceptDecision }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewContext() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error("useReviewContext must be used within a ReviewProvider");
  }
  return context;
}
