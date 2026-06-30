"""
Rationale Service for the Conseal Trust Center.

Pipeline position:
    DetectionService → ClassificationService → **RationaleService** → VerificationService

Generates deterministic, human-readable explanations for every
detection and classification decision based on the unified policy.
"""

from __future__ import annotations

from .policy import POLICY_RULES

def get_rationale(
    entity_type: str,
    text: str,
    status: str,
    evidence: str,
) -> tuple[str, str]:
    """
    Generate a deterministic, human-readable rationale for a classified
    entity by looking up the policy rule.

    Args:
        entity_type:  Presidio entity type (e.g. ``"PERSON"``)
        text:         The detected entity text
        status:       ``"redacted"`` or ``"nearMiss"``
        evidence:     Classification rule that fired
                      (e.g. ``"Rule:PublicFigure"``)

    Returns:
        ``(rationale, matched_recognizer)`` tuple.
    """
    rule = POLICY_RULES.get(evidence, POLICY_RULES["Rule:Unknown"])
    rationale = rule["rationale"]
    # We use the evidence string as the matched_recognizer for traceability
    matched_recognizer = evidence
    return rationale, matched_recognizer
