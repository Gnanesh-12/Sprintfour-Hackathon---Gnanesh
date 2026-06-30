/**
 * TypeScript types for the Conseal Trust Center.
 * Mirrors the backend Pydantic data model exactly.
 */

export type SpanType =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "ssn"
  | "date"
  | "organization"
  | "other";

export type SpanStatus = "redacted" | "nearMiss";

export interface Span {
  id: string;
  text: string;
  type: SpanType;
  startIndex: number;
  endIndex: number;
  confidence: number;
  rationale: string;
  matchedRecognizer: string;
  status: SpanStatus;
  needsReview: boolean;
  confidenceLevel?: string;
  risk?: string;
  recommendation?: string;
  category?: string;
  nearMissReason?: string;

  // Human-in-the-Loop fields
  userDecision?: SpanStatus;
  isOverridden?: boolean;
  originalDecision?: SpanStatus;
  overrideReason?: string;
  reviewStatus?: "pending" | "accepted" | "overridden";
}

export interface AnalyzeResponse {
  document: string;
  spans: Span[];
  fileType: string;
}

export interface VerificationResult {
  spanId: string;
  entityType: SpanType;
  originalText: string;
  foundInExport: boolean;
  verified: boolean;
  placeholderFound?: boolean;
  originalAbsent?: boolean;
  replacement?: string;
}

export interface VerifyResponse {
  originalDocument: string;
  processedDocument: string;
  exportedDocument: string;
  results: VerificationResult[];
  allPassed: boolean;
}

/** Color mapping for each PII type */
export const ENTITY_COLORS: Record<SpanType, string> = {
  name: "#3B82F6",
  phone: "#EF4444",
  email: "#F97316",
  address: "#14B8A6",
  ssn: "#B91C1C",
  date: "#8B5CF6", // reused near miss color? wait, near miss has a color, but date isn't explicitly colored in spec, let's keep it distinct but subtle. I'll use #6366f1.
  organization: "#64748B",
  other: "#9CA3AF",
};

/** Human-readable labels */
export const ENTITY_LABELS: Record<SpanType, string> = {
  name: "Person Name",
  phone: "Phone Number",
  email: "Email Address",
  address: "Address / Location",
  ssn: "Social Security Number",
  date: "Date",
  organization: "Organization",
  other: "Other",
};

/** Risk level based on entity type */
export function getRiskLevel(type: SpanType): "critical" | "high" | "medium" | "low" {
  switch (type) {
    case "ssn":
      return "critical";
    case "name":
    case "email":
    case "phone":
      return "high";
    case "address":
    case "date":
      return "medium";
    case "organization":
    case "other":
      return "low";
  }
}

export const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};
