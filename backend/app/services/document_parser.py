"""
Document Parser Service for Conseal Trust Center.

Extracts plain text from PDF, DOCX, and TXT files.
"""

import os
import tempfile
import fitz
import docx

def normalize_text(text: str) -> str:
    """
    Remove null characters, normalize line endings,
    preserve paragraphs, numbering, and bullets.
    """
    if not text:
        return ""
    # Remove null bytes
    text = text.replace("\x00", "")
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text

def extract_text_from_pdf(filepath: str) -> str:
    """Extract text from a PDF file, preserving line breaks."""
    text_parts = []
    try:
        with fitz.open(filepath) as pdf:
            for page in pdf:
                page_text = page.get_text("text") or ""
                text_parts.append(page_text)
    except Exception as e:
        raise ValueError("Failed to extract text from PDF: Corrupted or unreadable file") from e
    
    return "\n".join(text_parts)

def extract_text_from_docx(filepath: str) -> str:
    """Extract text from a DOCX file, preserving paragraphs."""
    try:
        doc = docx.Document(filepath)
        paragraphs = [p.text for p in doc.paragraphs]
        return "\n".join(paragraphs)
    except Exception as e:
        raise ValueError("Failed to extract text from DOCX: Corrupted or unreadable file") from e

def extract_text_from_txt(filepath: str) -> str:
    """Extract text from a TXT file, handling Unicode safely."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            raise ValueError("Failed to extract text from TXT: Encoding error") from e
    except Exception as e:
        raise ValueError("Failed to extract text from TXT: Unreadable file") from e

def extract_document(content: bytes, content_type: str = "", filename: str = "") -> str:
    """
    Automatically determine file type and extract normalized text.
    """
    if not content:
        raise ValueError("Empty file")
        
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    content_type = content_type.lower()
    
    # Determine file type
    if "pdf" in content_type or ext == ".pdf" or content.startswith(b"%PDF"):
        parser = extract_text_from_pdf
        suffix = ".pdf"
    elif "wordprocessingml" in content_type or ext == ".docx" or content.startswith(b"PK\x03\x04"):
        parser = extract_text_from_docx
        suffix = ".docx"
    elif "text/plain" in content_type or ext == ".txt":
        parser = extract_text_from_txt
        suffix = ".txt"
    else:
        # Fallback inspection
        if content.startswith(b"%PDF"):
            parser = extract_text_from_pdf
            suffix = ".pdf"
        elif content.startswith(b"PK\x03\x04"):
            parser = extract_text_from_docx
            suffix = ".docx"
        else:
            try:
                content.decode("utf-8")
                parser = extract_text_from_txt
                suffix = ".txt"
            except UnicodeDecodeError:
                raise ValueError("Unsupported file type")

    # Safe temp file handling
    temp_filepath = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_filepath = temp_file.name
            
        raw_text = parser(temp_filepath)
        return normalize_text(raw_text)
    finally:
        if temp_filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
