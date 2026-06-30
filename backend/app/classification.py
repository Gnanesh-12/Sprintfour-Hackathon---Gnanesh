"""
Classification Service for the Conseal Trust Center.

Pure deterministic rule engine.
No machine learning. No LLM. No inference.
Every decision comes from explicit rules and curated lookup lists.

Pipeline position:
    DetectionService → **ClassificationService** → RationaleService → VerificationService

Input:
    A list of RawDetection objects (entity text, type, confidence, section).

Output:
    A list of ClassificationResult objects (status, evidence, needs_review, risk, recommendation, category, near_miss_reason).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, TYPE_CHECKING, Optional
import re

from .models import SpanType, SpanStatus
from .policy import (
    POLICY_RULES,
    DEMO_PUBLIC_FIGURES,
    DEMO_FICTIONAL_CHARACTERS,
    DEMO_PUBLIC_ADDRESSES,
    ALWAYS_REDACT_TYPES,
    PERSONAL_SECTIONS,
    FICTIONAL_KEYWORDS,
    PUBLIC_FIGURE_KEYWORDS,
    CORPORATE_SUFFIXES,
)

if TYPE_CHECKING:
    from .detection import RawDetection


@dataclass
class ClassificationResult:
    """The output of classifying a single detected entity."""
    status: SpanStatus
    evidence: str
    needs_review: bool
    risk: Optional[str] = None
    recommendation: Optional[str] = None
    category: Optional[str] = None
    near_miss_reason: Optional[str] = None


def _get_classification_result(evidence: str, confidence: float) -> ClassificationResult:
    rule = POLICY_RULES.get(evidence, POLICY_RULES["Rule:Unknown"])
    
    # Needs review if rule explicitly says so, or if it's redacted and confidence < 0.70
    needs_review = rule.get("needs_review", False)
    if not needs_review and rule["status"] == SpanStatus.REDACTED and confidence < 0.70:
        needs_review = True

    return ClassificationResult(
        status=rule["status"],
        evidence=evidence,
        needs_review=needs_review,
        risk=rule.get("risk"),
        recommendation=rule.get("recommendation"),
        category=rule.get("category"),
        near_miss_reason=rule.get("near_miss_reason")
    )


def _classify_single_evidence(
    detection: "RawDetection",
    document: str,
) -> str:
    """Returns the evidence string for a single detection."""
    span_type = detection.span_type
    text = detection.text.strip()
    confidence = detection.confidence
    section = detection.section

    if span_type.value in ALWAYS_REDACT_TYPES:
        return f"Rule:AlwaysRedact:{span_type.value.upper()}"

    if span_type == SpanType.ORGANIZATION:
        return "Rule:Organization"

    if span_type == SpanType.NAME:
        if text in DEMO_FICTIONAL_CHARACTERS:
            return "Rule:FictionalCharacter"

        if text in DEMO_PUBLIC_FIGURES:
            return "Rule:PublicFigure"

        line_start = document.rfind("\n", 0, detection.start) + 1
        line_end = document.find("\n", detection.end)
        if line_end == -1:
            line_end = len(document)
        context = document[line_start:line_end].lower()

        if any(kw in context for kw in FICTIONAL_KEYWORDS):
            return "Rule:FictionalContext"

        if any(kw in context for kw in PUBLIC_FIGURE_KEYWORDS):
            return "Rule:PublicFigureContext"

        if section in PERSONAL_SECTIONS:
            return "Rule:SectionContext:Personal"

        return "Rule:PersonDefault"

    if span_type == SpanType.ADDRESS:
        for pub_addr in DEMO_PUBLIC_ADDRESSES:
            if pub_addr.lower() in text.lower():
                return "Rule:PublicAddress"
        return "Rule:AddressDefault"

    if span_type == SpanType.DATE:
        preceding_start = max(0, detection.start - 30)
        preceding = document[preceding_start:detection.start].lower()
        if "date:" in preceding:
            return "Rule:DocumentDate"
        return "Rule:DateDefault"

    if confidence < 0.50:
        return "Rule:LowConfidence"

    return "Rule:Default"


def classify_spans(
    detections: List["RawDetection"],
    document: str,
) -> List[ClassificationResult]:
    """
    Classify a list of raw detections using deterministic rules.
    Includes deterministic entity linking (alias resolution).
    """
    
    # 1. Alias grouping for PERSON spans
    person_names = {det.text.strip() for det in detections if det.span_type == SpanType.NAME}
    sorted_names = sorted(list(person_names), key=len, reverse=True)
    alias_map = {}
    
    def _strip_honorific(n: str) -> str:
        return re.sub(r'^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+', '', n, flags=re.IGNORECASE)

    for name in sorted_names:
        mapped = False
        stripped_name = _strip_honorific(name)
        for longer_name in sorted_names:
            if len(longer_name) <= len(name):
                continue
            # Deterministic check: is the shorter name a substring of the longer name?
            # We strip honorifics so "Mr. Parker" links to "Jonathan Parker".
            stripped_longer = _strip_honorific(longer_name)
            if stripped_name and stripped_name in stripped_longer:
                alias_map[name] = alias_map.get(longer_name, longer_name)
                mapped = True
                break
        if not mapped:
            alias_map[name] = name

    # 2. Evaluate all spans to get their independent evidence
    independent_evidences = [_classify_single_evidence(det, document) for det in detections]

    # 3. For NAME spans, find the highest-priority classification among aliases
    group_evidences = {}
    for det, ev in zip(detections, independent_evidences):
        if det.span_type == SpanType.NAME:
            primary_name = alias_map.get(det.text.strip(), det.text.strip())
            if primary_name not in group_evidences:
                group_evidences[primary_name] = []
            group_evidences[primary_name].append(ev)

    group_resolved_evidence = {}
    for primary_name, evs in group_evidences.items():
        # If any is redacted, pick the first redacted one. Otherwise pick the first near_miss.
        redacted_evs = [e for e in evs if POLICY_RULES.get(e, POLICY_RULES["Rule:Unknown"])["status"] == SpanStatus.REDACTED]
        if redacted_evs:
            group_resolved_evidence[primary_name] = redacted_evs[0]
        else:
            group_resolved_evidence[primary_name] = evs[0]

    # 4. Build final ClassificationResult list
    results = []
    for det, ev in zip(detections, independent_evidences):
        if det.span_type == SpanType.NAME:
            primary_name = alias_map.get(det.text.strip(), det.text.strip())
            final_evidence = group_resolved_evidence[primary_name]
        else:
            final_evidence = ev

        res = _get_classification_result(final_evidence, det.confidence)
        results.append(res)

    return results
