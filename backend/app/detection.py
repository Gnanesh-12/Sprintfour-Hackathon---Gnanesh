"""
Detection Service for the Conseal Trust Center.

Pipeline position:
    **DetectionService** → ClassificationService → RationaleService → VerificationService

Responsibilities (single responsibility — raw entity detection only):
    1. Run Presidio Analyzer with custom phone recognizers
    2. Run regex-based address detection
    3. Merge fragmented address spans into single entities
    4. Deduplicate overlapping spans (keep highest-confidence)
    5. Detect document sections (for downstream classification)
    6. Reclassify mis-typed corporate entities
    7. Delegate to ClassificationService and RationaleService
    8. Return final Span[] to the API layer

This service produces RAW detection results.
Classification (redacted vs nearMiss) is handled entirely by ClassificationService.
"""

from __future__ import annotations

import copy

import re
import uuid
from dataclasses import dataclass
from typing import List, Optional, Tuple

from presidio_analyzer import (
    AnalyzerEngine,
    PatternRecognizer,
    Pattern,
    RecognizerResult,
)

from .models import Span, SpanType, SpanStatus
from .classification import classify_spans, ClassificationResult, CORPORATE_SUFFIXES
from .rationale import get_rationale


# ---------------------------------------------------------------------------
# Presidio → Conseal type mapping
# ---------------------------------------------------------------------------

PRESIDIO_TYPE_MAP: dict[str, SpanType] = {
    "PERSON": SpanType.NAME,
    "PHONE_NUMBER": SpanType.PHONE,
    "EMAIL_ADDRESS": SpanType.EMAIL,
    "LOCATION": SpanType.ADDRESS,
    "US_SSN": SpanType.SSN,
    "DATE_TIME": SpanType.DATE,
    "NRP": SpanType.ORGANIZATION,
    "CREDIT_CARD": SpanType.OTHER,
    "IP_ADDRESS": SpanType.OTHER,
    "IBAN_CODE": SpanType.OTHER,
    "MEDICAL_LICENSE": SpanType.OTHER,
    "URL": SpanType.OTHER,
    "US_DRIVER_LICENSE": SpanType.OTHER,
    "US_PASSPORT": SpanType.OTHER,
    "US_BANK_NUMBER": SpanType.OTHER,
    "UK_NHS": SpanType.OTHER,
}


# ---------------------------------------------------------------------------
# Document Section Detection
# ---------------------------------------------------------------------------

SECTION_HEADERS: list[str] = [
    "Prepared by",
    "Client Information",
    "Employment Verification",
    "Background Check Summary",
    "References",
    "Notes",
    "Risk Assessment",
]


@dataclass
class DocumentSection:
    """A detected section within the document."""
    name: str
    start: int
    end: int


def detect_sections(text: str) -> List[DocumentSection]:
    """
    Detect document sections by finding known header patterns.

    Each section extends from its header until the next header or end
    of document.  Headers are matched at the start of a line followed
    by a colon (case-insensitive).
    """
    found: List[Tuple[str, int]] = []

    for header in SECTION_HEADERS:
        pattern = re.compile(
            r"^\s*" + re.escape(header) + r"\s*:",
            re.MULTILINE | re.IGNORECASE,
        )
        for match in pattern.finditer(text):
            found.append((header, match.start()))

    # Sort by position in document
    found.sort(key=lambda s: s[1])

    sections: List[DocumentSection] = []
    for i, (name, start) in enumerate(found):
        end = found[i + 1][1] if i + 1 < len(found) else len(text)
        sections.append(DocumentSection(name=name, start=start, end=end))

    return sections


def get_section_for_position(
    sections: List[DocumentSection],
    position: int,
) -> Optional[str]:
    """Return the section name for a given character position, or None."""
    for section in sections:
        if section.start <= position < section.end:
            return section.name
    return None


# ---------------------------------------------------------------------------
# Address regex  (merges fragmented Presidio LOCATION spans)
# ---------------------------------------------------------------------------
# Matches full addresses like:
#   742 Evergreen Terrace, Springfield, IL 62704
#   1 Infinite Loop, Cupertino, CA 95014
#   1600 Pennsylvania Avenue, Washington, DC 20500
#   221B Baker Street, London, UK

ADDRESS_REGEX = re.compile(
    r"\b"
    r"\d+[A-Za-z]?"                                # Street number (742, 221B, 1600)
    r"\s+"                                          # Space
    r"(?:[A-Za-z]+\s+)*?"                           # Street name words (non-greedy)
    r"(?:Street|St\.?|Avenue|Ave\.?|Terrace|Ter\.?" # Street suffix
    r"|Loop|Drive|Dr\.?|Road|Rd\.?"
    r"|Boulevard|Blvd\.?|Lane|Ln\.?"
    r"|Way|Place|Pl\.?|Court|Ct\.?)"
    r"(?:"                                          # Optional: city + state/zip or country
        r",\s*"                                     #   comma after suffix
        r"[A-Za-z]+(?:\s+[A-Za-z]+)*"              #   city name
        r",\s*"                                     #   comma after city
        r"(?:[A-Z]{2}\s+\d{5}(?:-\d{4})?"          #   US: ST ZIP
        r"|[A-Z]{2,})"                              #   Country: UK, USA, etc.
    r")?"
)


# ---------------------------------------------------------------------------
# Custom phone recogniser patterns
# ---------------------------------------------------------------------------
# Ensures all US phone formats are detected consistently.

PHONE_PATTERNS: list[Pattern] = [
    Pattern(
        name="us_phone_parens",
        regex=r"\(\d{3}\)\s*\d{3}[-.]?\d{4}",
        score=0.95,
    ),
    Pattern(
        name="us_phone_dashes",
        regex=r"(?<!\d)\d{3}[-.\s]\d{3}[-.\s]\d{4}(?!\d)",
        score=0.90,
    ),
    Pattern(
        name="us_phone_plus",
        regex=r"\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}",
        score=0.95,
    ),
]


# ---------------------------------------------------------------------------
# Custom organisation recogniser patterns
# ---------------------------------------------------------------------------
# Detects company names that Presidio's spaCy model may miss.

ORG_PATTERNS: list[Pattern] = [
    Pattern(
        name="corp_suffix",
        regex=r"\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(?:Inc\.?|Corp\.?|LLC|Ltd\.?|Co\.?|Group|Foundation|Association)\b",
        score=0.85,
    ),
]


# ---------------------------------------------------------------------------
# Singleton Presidio analyzer (with custom recognizers)
# ---------------------------------------------------------------------------

_analyzer: AnalyzerEngine | None = None


def _get_analyzer() -> AnalyzerEngine:
    """Lazy-initialise the Presidio analyzer with custom recognizers."""
    global _analyzer
    if _analyzer is None:
        _analyzer = AnalyzerEngine()

        phone_recognizer = PatternRecognizer(
            supported_entity="PHONE_NUMBER",
            name="ConsealPhoneRecognizer",
            patterns=PHONE_PATTERNS,
            context=["phone", "tel", "telephone", "mobile", "cell", "contact"],
        )
        _analyzer.registry.add_recognizer(phone_recognizer)

        org_recognizer = PatternRecognizer(
            supported_entity="NRP",  # maps to ORGANIZATION in our type map
            name="ConsealOrgRecognizer",
            patterns=ORG_PATTERNS,
        )
        _analyzer.registry.add_recognizer(org_recognizer)

    return _analyzer


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def _deduplicate(results: List[RecognizerResult]) -> List[RecognizerResult]:
    """
    Remove overlapping detections, keeping the highest-confidence one.
    Longer spans win when scores are equal.
    """
    if not results:
        return results

    sorted_results = sorted(
        results,
        key=lambda r: (r.start, -(r.end - r.start), -r.score),
    )
    deduped: List[RecognizerResult] = []

    for result in sorted_results:
        overlaps = False
        for accepted in deduped:
            if result.start < accepted.end and result.end > accepted.start:
                overlaps = True
                break
        if not overlaps:
            deduped.append(result)

    return deduped


# ---------------------------------------------------------------------------
# Address detection & merging
# ---------------------------------------------------------------------------

def _find_addresses(text: str) -> List[RecognizerResult]:
    """Use regex to find full multi-part addresses in the document."""
    results: List[RecognizerResult] = []
    for match in ADDRESS_REGEX.finditer(text):
        results.append(
            RecognizerResult(
                entity_type="LOCATION",
                start=match.start(),
                end=match.end(),
                score=0.90,
                analysis_explanation=None,
                recognition_metadata={
                    "recognizer_name": "ConsealAddressRecognizer",
                },
            )
        )
    return results


def _merge_addresses(
    presidio_results: List[RecognizerResult],
    regex_addresses: List[RecognizerResult],
) -> List[RecognizerResult]:
    """
    Replace fragmented Presidio LOCATION spans with full regex-detected
    addresses.

    For each regex address:
      - Remove Presidio LOCATION spans that fall entirely within it.
      - Add the regex address span instead.

    Non-LOCATION spans are never removed.
    """
    merged = list(presidio_results)

    for addr in regex_addresses:
        merged = [
            r for r in merged
            if not (
                r.entity_type == "LOCATION"
                and r.start >= addr.start
                and r.end <= addr.end
            )
        ]
        merged.append(addr)

    return merged


def _merge_adjacent_addresses(results: List[RecognizerResult], text: str) -> List[RecognizerResult]:
    """Merge consecutive LOCATION spans separated only by whitespace or commas."""
    if not results:
        return results

    # Sort results to process them in order
    sorted_results = sorted(results, key=lambda r: r.start)
    merged: List[RecognizerResult] = []

    for r in sorted_results:
        if not merged:
            merged.append(copy.copy(r))
            continue
        
        last = merged[-1]
        
        if last.entity_type == "LOCATION" and r.entity_type == "LOCATION":
            # Check the text strictly between the end of 'last' and the start of 'r'
            text_between = text[last.end:r.start]
            if re.fullmatch(r'[\s,\n]*', text_between):
                # Merge 'r' into 'last'
                last.end = max(last.end, r.end)
                continue
                
        merged.append(copy.copy(r))

    return merged


def _find_aliases(results: List[RecognizerResult], text: str) -> List[RecognizerResult]:
    """
    Generate and detect aliases for multi-word PERSON spans.
    Finds first name, last name, and honorific + last name combinations.
    """
    new_results = list(results)
    
    # Extract known full names
    full_names = {text[r.start:r.end].strip() for r in results if r.entity_type == "PERSON"}
    
    aliases_to_find = set()
    for name in full_names:
        parts = name.split()
        if len(parts) >= 2:
            first = parts[0]
            last = parts[-1]
            aliases_to_find.add(first)
            aliases_to_find.add(last)
            aliases_to_find.add(f"Mr. {last}")
            aliases_to_find.add(f"Ms. {last}")
            aliases_to_find.add(f"Mrs. {last}")
            aliases_to_find.add(f"Dr. {last}")
            
    # Also find aliases that are not already covered by existing spans
    for alias in aliases_to_find:
        escaped_alias = re.escape(alias)
        pattern = re.compile(r'\b' + escaped_alias + r'\b', re.IGNORECASE)
        for match in pattern.finditer(text):
            new_results.append(
                RecognizerResult(
                    entity_type="PERSON",
                    start=match.start(),
                    end=match.end(),
                    score=0.85, # Assign a high score since it's an alias of a known entity
                    analysis_explanation=None,
                    recognition_metadata={
                        "recognizer_name": "ConsealAliasRecognizer",
                    },
                )
            )
    return new_results


# ---------------------------------------------------------------------------
# Span cleaning  (trim noisy boundaries)
# ---------------------------------------------------------------------------

def _clean_spans(
    results: List[RecognizerResult],
    text: str,
) -> List[RecognizerResult]:
    """
    Clean up Presidio detection boundaries.

    Fixes:
      - PERSON spans that extend across newlines
        (e.g. "Jonathan Parker\n- Date" → "Jonathan Parker")
      - Possessive suffixes on PERSON spans
        (e.g. "Elon Musk's" → "Elon Musk")
    """
    cleaned: List[RecognizerResult] = []

    for r in results:
        start, end = r.start, r.end

        if r.entity_type == "PERSON":
            entity_text = text[start:end]

            # Trim at first newline
            nl_pos = entity_text.find("\n")
            if nl_pos != -1:
                end = start + nl_pos
                entity_text = text[start:end]

            # Strip trailing possessive
            for suffix in ("'s", "\u2019s"):
                if entity_text.endswith(suffix):
                    end -= len(suffix)
                    entity_text = text[start:end]
                    break

            # Strip trailing whitespace / punctuation
            entity_text = entity_text.rstrip()
            end = start + len(entity_text)

        elif r.entity_type == "DATE_TIME":
            entity_text = text[start:end]

            # Trim at first newline
            nl_pos = entity_text.find("\n")
            if nl_pos != -1:
                end = start + nl_pos
                entity_text = text[start:end]

            # Strip trailing non-date characters (hyphens, bullets, etc.)
            entity_text = entity_text.rstrip(" \t-\u2022*")
            end = start + len(entity_text)

        # Skip empty spans
        if end <= start:
            continue

        new_r = copy.copy(r)
        new_r.start = start
        new_r.end = end
        cleaned.append(new_r)

    return cleaned


# ---------------------------------------------------------------------------
# Raw Detection (intermediate data before classification)
# ---------------------------------------------------------------------------

@dataclass
class RawDetection:
    """A raw detected entity before classification."""
    text: str
    entity_type: str          # Presidio type  (PERSON, PHONE_NUMBER, …)
    span_type: SpanType       # Conseal type   (name, phone, …)
    start: int
    end: int
    confidence: float
    recognizer_name: str
    section: Optional[str]    # Document section this entity appears in


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_document(text: str) -> List[Span]:
    """
    Analyse a document for PII entities.

    Full pipeline:
        1. Presidio detection  (with custom phone recognizer)
        2. Regex-based address detection
        3. Address merging     (fragments → single spans)
        4. Deduplication
        5. Section detection
        6. Corporate-suffix reclassification
        7. Classification      (deterministic rules)
        8. Rationale generation
        9. Build final Span objects

    Returns a list of Span objects ready for the frontend.
    """
    analyzer = _get_analyzer()

    # --- Step 1: Presidio ---
    presidio_results = analyzer.analyze(
        text=text,
        language="en",
        entities=None,  # detect all supported entity types
    )

    # --- Step 2: Regex address detection ---
    regex_addresses = _find_addresses(text)

    # --- Step 3: Merge fragmented addresses ---
    merged = _merge_addresses(list(presidio_results), regex_addresses)

    # --- Step 4: Clean span boundaries ---
    merged = _clean_spans(merged, text)

    # --- Step 5: Deduplicate ---
    merged = _deduplicate(merged)
    merged.sort(key=lambda r: r.start)

    # --- Step 5.1: Merge adjacent fragmented addresses ---
    merged = _merge_adjacent_addresses(merged, text)

    # --- Step 5.2: Detect aliases ---
    merged = _find_aliases(merged, text)
    
    # Re-deduplicate just in case aliases overlap
    merged = _deduplicate(merged)
    merged.sort(key=lambda r: r.start)

    # --- Step 5: Section detection ---
    sections = detect_sections(text)

    # --- Step 6 & 7: Build raw detections with reclassification ---
    raw_detections: List[RawDetection] = []
    for result in merged:
        entity_text = text[result.start:result.end]
        span_type = PRESIDIO_TYPE_MAP.get(result.entity_type, SpanType.OTHER)

        # 6a — Reclassify entities with corporate suffixes as ORGANIZATION
        if span_type == SpanType.NAME and any(
            entity_text.rstrip(".").endswith(suf.rstrip("."))
            for suf in CORPORATE_SUFFIXES
        ):
            span_type = SpanType.ORGANIZATION

        section = get_section_for_position(sections, result.start)
        recognizer_name = (
            result.recognition_metadata.get("recognizer_name", "PresidioBuiltIn")
            if result.recognition_metadata
            else "PresidioBuiltIn"
        )

        raw_detections.append(RawDetection(
            text=entity_text,
            entity_type=result.entity_type,
            span_type=span_type,
            start=result.start,
            end=result.end,
            confidence=round(result.score, 2),
            recognizer_name=recognizer_name,
            section=section,
        ))

    # --- Step 7: Classification ---
    classifications = classify_spans(raw_detections, text)

    # --- Step 8 & 9: Rationale + final Span construction ---
    spans: List[Span] = []
    for det, cls in zip(raw_detections, classifications):
        rationale, matched_recognizer = get_rationale(
            entity_type=det.entity_type,
            text=det.text,
            status=cls.status.value,
            evidence=cls.evidence,
        )

        if det.confidence >= 0.85:
            confidence_level = "High"
        elif det.confidence >= 0.70:
            confidence_level = "Medium"
        elif det.confidence >= 0.50:
            confidence_level = "Low"
        else:
            confidence_level = "Needs Review"

        span = Span(
            id=f"span-{uuid.uuid4().hex[:8]}",
            text=det.text,
            type=det.span_type,
            startIndex=det.start,
            endIndex=det.end,
            confidence=det.confidence,
            rationale=rationale,
            matchedRecognizer=matched_recognizer,
            status=cls.status,
            needsReview=cls.needs_review,
            confidenceLevel=confidence_level,
            risk=cls.risk,
            recommendation=cls.recommendation,
            category=cls.category,
            nearMissReason=cls.near_miss_reason,
        )
        spans.append(span)

    return spans
