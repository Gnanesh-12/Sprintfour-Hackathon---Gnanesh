/**
 * API client for the Conseal Trust Center backend.
 */

import type { AnalyzeResponse, Span, VerifyResponse } from "./types";

const API_BASE = "http://localhost:8000";

export async function analyzeDocument(payload: string | File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  if (typeof payload === "string") {
    const blob = new Blob([payload], { type: "text/plain" });
    formData.append("file", blob, "document.txt");
  } else {
    formData.append("file", payload);
  }

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(error.detail || "Analysis failed");
  }

  return response.json();
}

/**
 * Verify that all redacted spans have been removed from the export.
 */
export async function verifyDocument(
  document: string,
  spans: Span[]
): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document, spans }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(error.detail || "Verification failed");
  }

  return response.json();
}

/**
 * Fetch the built-in seed document.
 */
export async function fetchSeedDocument(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/seed`);

  if (!response.ok) {
    throw new Error("Failed to fetch seed document");
  }

  const data = await response.json();
  return data.document;
}

export interface ExportResponse {
  downloadUrl: string;
  fileType: string;
  verificationStatus: string;
}

/**
 * Generate a downloadable redacted file preserving original format.
 */
export async function exportDocument(
  payload: string | File,
  spans: Span[]
): Promise<ExportResponse> {
  const formData = new FormData();
  if (typeof payload === "string") {
    const blob = new Blob([payload], { type: "text/plain" });
    formData.append("file", blob, "document.txt");
  } else {
    formData.append("file", payload);
  }
  formData.append("spans", JSON.stringify(spans));

  const response = await fetch(`${API_BASE}/api/export`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Export failed" }));
    throw new Error(error.detail || "Export failed");
  }

  return response.json();
}

export interface PreviewResponse {
  previewUrl: string;
  fileType: string;
  redactedText?: string;
}

/**
 * Generate a quick redacted preview without verification overhead.
 */
export async function fetchPreview(
  payload: string | File,
  spans: Span[]
): Promise<PreviewResponse> {
  const formData = new FormData();
  if (typeof payload === "string") {
    const blob = new Blob([payload], { type: "text/plain" });
    formData.append("file", blob, "document.txt");
  } else {
    formData.append("file", payload);
  }
  formData.append("spans", JSON.stringify(spans));

  const response = await fetch(`${API_BASE}/api/preview`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Preview generation failed" }));
    throw new Error(error.detail || "Preview generation failed");
  }

  return response.json();
}
