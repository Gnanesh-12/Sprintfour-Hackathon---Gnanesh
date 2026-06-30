"""
Verification Service for the Conseal Trust Center.

Pipeline position:
    DetectionService → ClassificationService → RationaleService → **VerificationService**

Implements mechanical verification that redacted values have
actually been removed from the exported document.

This is NOT visual masking.  It is a deterministic check:
    span.text not in exported_document

The service produces three document states:
    1. Original  — the raw input text
    2. Processed — with [REDACTED:TYPE] placeholders
    3. Exported  — the final safe-to-share document

Then verifies that no original redacted value appears in the export.

Formatting preservation guarantees:
    • Replacements use string slicing on the original document.
    • The document is never rebuilt from entities.
    • Spans are replaced from highest startIndex to lowest so that
      earlier replacements never invalidate later span positions.
    • Original whitespace, line breaks, indentation, numbering, and
      bullets are preserved exactly.
"""

from __future__ import annotations

from typing import List

from .models import (
    Span,
    SpanStatus,
    VerificationResult,
    VerifyResponse,
)


def _build_exported_document(document: str, spans: List[Span]) -> str:
    """
    Replace redacted spans with [REDACTED:TYPE] placeholders.

    Processes spans from end to start to preserve character offsets.
    Only redacted spans are replaced; near-misses remain visible.
    """
    # Filter to redacted spans only
    redacted_spans = [s for s in spans if s.status == SpanStatus.REDACTED]

    # Sort by start index descending so replacements don't shift offsets
    redacted_spans.sort(key=lambda s: s.start_index, reverse=True)

    result = document
    for span in redacted_spans:
        placeholder = f"[REDACTED:{span.type.value.upper()}]"
        result = result[:span.start_index] + placeholder + result[span.end_index:]

    return result


def verify_redaction(document: str, spans: List[Span]) -> VerifyResponse:
    """
    Verify that every redacted span's text has been removed from
    the exported document.

    Returns a VerifyResponse with:
      - original_document
      - processed_document (with placeholders)
      - exported_document (same as processed — the safe version)
      - per-span verification results
      - all_passed boolean
    """
    exported = _build_exported_document(document, spans)

    results: List[VerificationResult] = []
    all_passed = True

    for span in spans:
        if span.status != SpanStatus.REDACTED:
            continue

        # Mechanical verification: is the original text still present?
        found_in_export = span.text in exported
        original_absent = not found_in_export

        placeholder = f"[REDACTED:{span.type.value.upper()}]"
        placeholder_found = placeholder in exported

        verified = original_absent and placeholder_found
        if not verified:
            all_passed = False

        results.append(
            VerificationResult(
                spanId=span.id,
                entityType=span.type,
                originalText=span.text,
                foundInExport=found_in_export,
                verified=verified,
                placeholderFound=placeholder_found,
                originalAbsent=original_absent,
                replacement=placeholder,
            )
        )

    return VerifyResponse(
        originalDocument=document,
        processedDocument=exported,  # show the processed version
        exportedDocument=exported,
        results=results,
        allPassed=all_passed,
    )
