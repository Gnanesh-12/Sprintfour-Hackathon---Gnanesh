"""
Pydantic models for the Conseal Trust Center API.

Every model is strongly typed with clear documentation
so that API consumers know exactly what to expect.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SpanType(str, Enum):
    """Supported PII entity types."""
    NAME = "name"
    PHONE = "phone"
    EMAIL = "email"
    ADDRESS = "address"
    SSN = "ssn"
    DATE = "date"
    ORGANIZATION = "organization"
    OTHER = "other"


class SpanStatus(str, Enum):
    """Whether the span was redacted or left visible (near miss)."""
    REDACTED = "redacted"
    NEAR_MISS = "nearMiss"

class RedactionStyle(str, Enum):
    """How the redacted text should be visually replaced."""
    SOLID_BLACK = "SolidBlack"
    BLOCK_CHARACTER = "BlockCharacter"
    TYPE_LABEL = "TypeLabel"


# ---------------------------------------------------------------------------
# Core data model
# ---------------------------------------------------------------------------

class Span(BaseModel):
    """A single detected entity within the document."""

    id: str = Field(..., description="Unique identifier for this span")
    text: str = Field(..., description="The original text of the entity")
    type: SpanType = Field(..., description="Category of PII")
    start_index: int = Field(..., alias="startIndex", description="Start character offset")
    end_index: int = Field(..., alias="endIndex", description="End character offset")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence 0–1")
    rationale: str = Field(..., description="Plain-language explanation of why this was flagged")
    matched_recognizer: str = Field(..., alias="matchedRecognizer", description="Presidio recognizer that matched")
    status: SpanStatus = Field(..., description="redacted or nearMiss")
    needs_review: bool = Field(..., alias="needsReview", description="True if confidence < 0.70")
    confidence_level: Optional[str] = Field(None, alias="confidenceLevel", description="High, Medium, Low, Needs Review")
    risk: Optional[str] = Field(None, description="Low, Medium, High")
    recommendation: Optional[str] = Field(None, description="e.g. Keep Visible")
    category: Optional[str] = Field(None, description="e.g. Public Address")
    verification_status: Optional[str] = Field(None, alias="verificationStatus")
    near_miss_reason: Optional[str] = Field(None, alias="nearMissReason", description="e.g. Organization")
    
    # Human-in-the-Loop fields
    user_decision: Optional[SpanStatus] = Field(None, alias="userDecision", description="User's final override decision")
    is_overridden: bool = Field(False, alias="isOverridden", description="True if the user changed the AI recommendation")
    original_decision: Optional[SpanStatus] = Field(None, alias="originalDecision", description="The original AI recommendation")
    override_reason: Optional[str] = Field(None, alias="overrideReason", description="Reason for override")
    review_status: str = Field("pending", alias="reviewStatus", description="'pending', 'accepted', or 'overridden'")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "span-1",
                "text": "John Doe",
                "type": "name",
                "startIndex": 0,
                "endIndex": 8,
                "confidence": 0.95,
                "rationale": "Matched a personal name recognizer. This appears to be a real person's name.",
                "matchedRecognizer": "SpacyRecognizer",
                "status": "redacted",
                "needsReview": False,
            }
        },
    }


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """Request body for POST /api/analyze."""
    document: str = Field(..., min_length=1, description="The document text to analyze")


class AnalyzeResponse(BaseModel):
    """Response body for POST /api/analyze."""
    document: str = Field(..., description="Original document text")
    spans: List[Span] = Field(default_factory=list, description="Detected entities")
    file_type: str = Field("txt", alias="fileType", description="Document file type extension")

    model_config = {"populate_by_name": True}


class VerificationResult(BaseModel):
    """Result of verifying a single redacted span."""
    span_id: str = Field(..., alias="spanId")
    entity_type: SpanType = Field(..., alias="entityType")
    original_text: str = Field(..., alias="originalText")
    found_in_export: bool = Field(..., alias="foundInExport", description="True means FAILED verification")
    verified: bool = Field(..., description="True means the value was successfully removed")
    placeholder_found: bool = Field(False, alias="placeholderFound", description="True if placeholder text was found")
    original_absent: bool = Field(False, alias="originalAbsent", description="True if original text was removed")
    replacement: str = Field("", description="The placeholder string used")

    model_config = {"populate_by_name": True}


class VerifyRequest(BaseModel):
    """Request body for POST /api/verify."""
    document: str = Field(..., min_length=1)
    spans: List[Span] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class VerifyResponse(BaseModel):
    """Response body for POST /api/verify."""
    original_document: str = Field(..., alias="originalDocument")
    processed_document: str = Field(..., alias="processedDocument")
    exported_document: str = Field(..., alias="exportedDocument")
    results: List[VerificationResult] = Field(default_factory=list)
    all_passed: bool = Field(..., alias="allPassed")

    model_config = {"populate_by_name": True}
