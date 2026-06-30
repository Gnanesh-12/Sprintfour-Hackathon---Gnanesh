"""
Central Policy Configuration for Conseal Trust Center.

This module contains all deterministic rules, rationales, and metadata
used by ClassificationService and RationaleService.
"""

from typing import Dict, Any, Optional
from .models import SpanStatus

# ---------------------------------------------------------------------------
# Curated Lookup Lists (scoped to demo document)
# ---------------------------------------------------------------------------

DEMO_PUBLIC_FIGURES: set[str] = {
    "Elon Musk",
}

DEMO_FICTIONAL_CHARACTERS: set[str] = {
    "Sherlock Holmes",
}

DEMO_PUBLIC_ADDRESSES: set[str] = {
    "1 Infinite Loop",
    "1600 Pennsylvania Avenue",
    "221B Baker Street",
}

# Entity types that are always redacted regardless of context.
ALWAYS_REDACT_TYPES: set[str] = {
    "email",
    "phone",
    "ssn",
}

# Document sections that contain personal/private information.
PERSONAL_SECTIONS: set[str] = {
    "Prepared by",
    "Client Information",
    "References",
}

# Context keywords that suggest a fictional character.
FICTIONAL_KEYWORDS: set[str] = {
    "fictional",
    "detective",
    "novel",
    "character",
}

# Context keywords that suggest a public figure.
PUBLIC_FIGURE_KEYWORDS: set[str] = {
    "news",
    "article",
    "technology",
    "venture",
    "ceo",
    "public figure",
}

CORPORATE_SUFFIXES: tuple[str, ...] = (
    "Inc.", "Inc", "Corp.", "Corp", "LLC", "Ltd.", "Ltd",
    "Co.", "Group", "Foundation", "Association",
)

# ---------------------------------------------------------------------------
# Policy Definitions
# ---------------------------------------------------------------------------

POLICY_RULES: Dict[str, Dict[str, Any]] = {
    # ----- Always-redact types -----
    "Rule:AlwaysRedact:EMAIL": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a standard email address pattern (user@domain). "
            "Email addresses are directly linkable to individuals and "
            "are always redacted to prevent unsolicited contact or "
            "identity correlation."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Email Address",
    },
    "Rule:AlwaysRedact:PHONE": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a personal phone number pattern. Phone numbers "
            "can be used to identify or contact individuals directly. "
            "All personal phone numbers are always redacted."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Phone Number",
    },
    "Rule:AlwaysRedact:SSN": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a Social Security Number pattern (XXX-XX-XXXX). "
            "SSNs are highly sensitive — they can enable identity theft. "
            "SSNs are always redacted."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Social Security Number",
    },

    # ----- Organization -----
    "Rule:Organization": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "Organization names are not personally identifying "
            "information. Corporate and institutional names are left "
            "visible because they do not reveal private individual data."
        ),
        "risk": "Low",
        "recommendation": "Keep Visible",
        "category": "Organization",
        "near_miss_reason": "Organization",
    },

    # ----- Person rules -----
    "Rule:FictionalCharacter": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This refers to a fictional character rather than a real "
            "individual. Fictional names do not constitute personally "
            "identifiable information. Left visible because no real "
            "person's privacy is at risk."
        ),
        "risk": "Low",
        "recommendation": "Keep Visible",
        "category": "Person (Fictional)",
        "near_miss_reason": "Fictional Character",
    },
    "Rule:PublicFigure": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This is a globally recognized public figure. References "
            "to public figures in a business or news context are not "
            "private PII. Left visible."
        ),
        "risk": "Low",
        "recommendation": "Keep Visible",
        "category": "Person (Public Figure)",
        "near_miss_reason": "Public Figure",
    },
    "Rule:FictionalContext": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This name appears in a context that suggests a fictional "
            "character (e.g., near words like 'fictional', 'detective', "
            "'novel'). Left visible but flagged for review."
        ),
        "risk": "Medium",
        "recommendation": "Review Required",
        "category": "Person (Contextual)",
        "near_miss_reason": "Context suggests Fictional",
    },
    "Rule:PublicFigureContext": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This name appears in a context that suggests a public "
            "figure (e.g., near words like 'article', 'technology', "
            "'venture'). Left visible but flagged for review."
        ),
        "risk": "Medium",
        "recommendation": "Review Required",
        "category": "Person (Contextual)",
        "near_miss_reason": "Context suggests Public Figure",
    },
    "Rule:SectionContext:Personal": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Identified as a person's name appearing in personal "
            "client information. Names in sections like Client "
            "Information, References, or Prepared By are treated as "
            "private PII and redacted."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Person",
    },
    "Rule:PersonDefault": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a personal name recognizer. This text appears to "
            "be a real person's name, which is personally identifiable "
            "information. Redacting to prevent identity disclosure."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Person",
    },

    # ----- Address rules -----
    "Rule:PublicAddress": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This is a known public location (matched against the "
            "curated public addresses list) rather than a private "
            "residence. Public landmarks and corporate headquarters "
            "do not constitute private location data. Left visible."
        ),
        "risk": "Low",
        "recommendation": "Keep Visible",
        "category": "Public Address",
        "near_miss_reason": "Public Location",
    },
    "Rule:AddressDefault": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched an address or location recognizer. Physical "
            "addresses can reveal where someone lives or works. "
            "Redacting to protect location privacy."
        ),
        "risk": "High",
        "recommendation": "Redact",
        "category": "Personal Address",
    },

    # ----- Date rules -----
    "Rule:DocumentDate": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "This is a document-level date (e.g., memo date), not a "
            "person's date of birth or other sensitive personal date. "
            "Document dates are generally safe to share. Left visible."
        ),
        "risk": "Low",
        "recommendation": "Keep Visible",
        "category": "Document Date",
        "near_miss_reason": "Document Date",
    },
    "Rule:DateDefault": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a date/time recognizer. Dates of birth and "
            "specific event dates can narrow identity when combined "
            "with other information. Redacting as a precaution."
        ),
        "risk": "Medium",
        "recommendation": "Redact",
        "category": "Date",
    },

    # ----- Fallback rules -----
    "Rule:LowConfidence": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "Matched a recognizer pattern but with insufficient "
            "confidence to warrant automatic redaction. Manual review "
            "is recommended."
        ),
        "risk": "Medium",
        "recommendation": "Review Required",
        "category": "Unknown",
        "near_miss_reason": "Low Confidence",
    },
    "Rule:Default": {
        "status": SpanStatus.REDACTED,
        "rationale": (
            "Matched a pattern recognizer for potentially sensitive "
            "information. Redacting as a precaution."
        ),
        "risk": "Medium",
        "recommendation": "Redact",
        "category": "Unknown",
    },
    "Rule:Unknown": {
        "status": SpanStatus.NEAR_MISS,
        "rationale": (
            "Detected by the analysis pipeline. Classification was applied "
            "based on entity type and document context."
        ),
        "risk": "Medium",
        "recommendation": "Review Required",
        "category": "Unknown",
        "near_miss_reason": "Unknown Evidence",
    }
}
