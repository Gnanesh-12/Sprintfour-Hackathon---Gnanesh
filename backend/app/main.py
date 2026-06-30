"""
FastAPI application for the Conseal Trust Center.

Endpoints:
    POST /api/analyze  — Detect PII in a document, return spans with rationales
    POST /api/verify   — Verify redactions are mechanically removed
    GET  /api/seed     — Return the seed document for demo purposes
    GET  /api/health   — Health check
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import tempfile
import os
import json

from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    VerifyRequest,
    VerifyResponse,
    Span,
)
from .detection import analyze_document
from .verification import verify_redaction
from .seed import SEED_DOCUMENT
from .services.document_parser import extract_document


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Conseal Trust Center API",
    description=(
        "A Trust Center API that helps users confidently decide whether "
        "a document is safe to share with AI. Every decision is explained, "
        "verified, and challengeable."
    ),
    version="1.0.0",
)

# Setup exports directory — must match ExportService.generate_export output path
exports_dir = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(exports_dir, exist_ok=True)
app.mount("/exports", StaticFiles(directory=exports_dir), name="exports")

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Simple health check."""
    return {"status": "ok", "service": "conseal-trust-center"}


@app.get("/api/seed")
async def get_seed_document():
    """Return the built-in seed document for demo purposes."""
    return {"document": SEED_DOCUMENT}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: Request):
    """
    Analyze a document for PII entities.

    Accepts:
    - application/json: {"document": "plain text"}
    - multipart/form-data: form field `file` containing PDF/DOCX/TXT
    - application/pdf, etc. (raw binary upload)
    """
    try:
        content_type = request.headers.get("content-type", "").lower()
        
        if "multipart/form-data" in content_type:
            form = await request.form()
            file = form.get("file")
            if not file or not hasattr(file, "filename"):
                raise ValueError("No file uploaded")
            content = await file.read()
            mime_type = file.content_type
            filename = file.filename
        elif "application/json" in content_type:
            body = await request.json()
            doc = body.get("document", "")
            content = doc.encode("utf-8")
            mime_type = "text/plain"
            filename = "document.txt"
        else:
            # Raw binary upload
            content = await request.body()
            mime_type = content_type
            filename = ""
            
        extracted_text = extract_document(content, mime_type, filename)
        spans = analyze_document(extracted_text)
        
        file_ext = ""
        if filename:
            file_ext = os.path.splitext(filename)[1].lower().replace(".", "")
        elif "pdf" in mime_type:
            file_ext = "pdf"
        elif "wordprocessingml" in mime_type:
            file_ext = "docx"
        elif "text" in mime_type:
            file_ext = "txt"

        return AnalyzeResponse(
            document=extracted_text,
            spans=spans,
            fileType=file_ext or "txt"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Analysis failed",
        )


@app.post("/api/verify", response_model=VerifyResponse)
async def verify(request: VerifyRequest):
    """
    Verify that all redacted spans have been mechanically removed
    from the exported document.

    This does NOT rely on visual masking. It checks:
        span.text not in exported_document
    """
    try:
        result = verify_redaction(request.document, request.spans)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}",
        )


import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

@app.post("/api/preview")
async def preview_document(
    file: UploadFile = File(...),
    spans: str = Form(...)
):
    """Generate a quick redacted preview without verification overhead."""
    try:
        spans_list = [Span(**s) for s in json.loads(spans)]
        
        content = await file.read()
        mime_type = file.content_type
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
            
        from .services.export_service import ExportService
        
        out_path = ExportService.generate_export(tmp_path, mime_type, spans_list)
        
        os.remove(tmp_path)
        
        if not os.path.exists(out_path):
            raise HTTPException(status_code=500, detail="Preview generation failed.")
            
        filename = os.path.basename(out_path)
        file_ext = os.path.splitext(filename)[1].lower().replace(".", "")
        preview_url = f"http://localhost:8000/exports/{filename}"
        
        response_data = {
            "previewUrl": preview_url,
            "fileType": file_ext
        }
        
        if file_ext == "txt":
            with open(out_path, "r", encoding="utf-8") as f:
                response_data["redactedText"] = f.read()
                
        return response_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Preview failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export")
async def export_document(
    file: UploadFile = File(...),
    spans: str = Form(...)
):
    try:
        spans_list = [Span(**s) for s in json.loads(spans)]
        
        content = await file.read()
        mime_type = file.content_type
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
            
        from .services.export_service import ExportService
        from .services.document_parser import extract_document
        
        # 1. Export the redacted file
        out_path = ExportService.generate_export(tmp_path, mime_type, spans_list)
        
        # 2. Extract text from the redacted file for verification
        with open(out_path, "rb") as f:
            redacted_content = f.read()
        
        redacted_text = extract_document(redacted_content, mime_type, os.path.basename(out_path))
        
        # 3. Verify redaction
        verification = verify_redaction(redacted_text, spans_list)
        
        if verification.all_passed:
            logger.info("Verification passed")
        else:
            logger.warning("Verification failed for some spans")
            
        # Cleanup input temp
        os.remove(tmp_path)
        
        if not os.path.exists(out_path):
            raise HTTPException(status_code=500, detail="Exported file missing from exports directory.")
            
        filename = os.path.basename(out_path)
        file_ext = os.path.splitext(filename)[1].lower().replace(".", "")
        
        export_url = f"http://localhost:8000/exports/{filename}"
        
        logger.info("Export completed")
        
        return {
            "downloadUrl": export_url,
            "previewUrl": export_url,
            "verificationStatus": "passed" if verification.all_passed else "failed",
            "fileType": file_ext,
            "exportTimestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    """Pre-load the Presidio analyzer on startup to avoid first-request lag."""
    from .detection import _get_analyzer
    print("[*] Pre-loading Presidio Analyzer...")
    _get_analyzer()
    print("[OK] Presidio Analyzer ready")
