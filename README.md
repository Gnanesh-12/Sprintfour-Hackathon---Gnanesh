# Conseal Trust Center

**Explain • Verify • Challenge**

A Trust Center application designed for the Conseal Hackathon (Problem Statement 1 – Trust & Explainability). This project deliberately focuses on **trust rather than detection**. It doesn't just visually mask data; it explains the reasoning, mechanically verifies removal, and admits uncertainty so the user can make informed decisions.

## Architecture & Tech Stack

```text
React Frontend (Vite, TS, Tailwind v4)
        │
        ▼
FastAPI Backend (Python)
        │
        ▼
Detection Service (Microsoft Presidio)
        │
        ▼
Rationale Engine (Deterministic Mapping)
        │
        ▼
Verification Service (Mechanical check)
        │
        ▼
Frontend
```

## Features Implemented (As per Requirements)

1. **Document Viewer**: Polished UI with inline span highlighting.
2. **Explanation Panel**: Side panel detailing original text, type, confidence, plain-language rationale, and risk level.
3. **Near-Miss Toggle (Signature Feature)**: Toggle to reveal entities the system considered but *deliberately chose not to redact*, explaining *why* they remained visible.
4. **Verification Panel**: Three-stage pipeline visualizing the original, processed, and exported document. Includes a mechanical check verifying that `span.text not in exported_document`.
5. **Review Queue**: Surfaces uncertain decisions (confidence < 0.70) for human review and challenge.

## Philosophy & Design Decisions

- **Deterministic Rationale (Presidio over LLM)**: Every explanation is traceable to a specific recognizer or rule instead of model-generated reasoning. This prevents hallucinations in the explanation layer.
- **Verification > Masking**: We do not rely on visual masking on the frontend. The backend actively verifies the exact string match is no longer present in the payload.
- **Admitting Uncertainty**: By surfacing lower-confidence detections in the Review Queue, we admit uncertainty instead of pretending the system is perfect, building trust through honesty.
- **Curated Overrides**: To demonstrate contextual reasoning without requiring an LLM, a set of curated overrides is built into the seed data (e.g. "Sherlock Holmes" -> nearMiss, "Apple Inc." -> nearMiss).

## Deliberately Not Implemented

As per the hackathon spec, the following items were intentionally deferred to maximize the quality and completeness of the core explainability features within time constraints:

- Trust Dashboard & Trust Ledger
- Privacy Certificate
- Authentication & Database
- Batch processing & Multi-document support
- Cloud LLM contextual reasoning

## Setup & Running

### Requirements
- Python 3.9+
- Node.js 18+

### Install Dependencies
```bash
npm run install:all
# Or run manually:
# cd backend && pip install -r requirements.txt
# cd frontend && npm install
```

### Run the App
```bash
# Starts both frontend and backend concurrently
npm run dev
```

* Backend runs on http://localhost:8000
* Frontend runs on http://localhost:5173

Once started, use the **"Load Sample Document"** button in the app to populate the editor with the seed document, which contains curated examples demonstrating all PII types and Near-Miss entities.