# Conseal Trust Center

**"Trust Every Redaction."**

Conseal Trust Center is an enterprise-grade document redaction platform designed to solve the "black-box AI" problem in data privacy. Instead of simply redacting a document and expecting users to blindly trust the result, Conseal is built around absolute transparency, explainability, and mathematical verification.

![Conseal Workspace Preview](https://via.placeholder.com/1000x500.png?text=Conseal+Trust+Center+Workspace)

---

## 🎯 The Core Philosophy

When sharing sensitive documents with AI or third parties, users need to answer four fundamental questions. Every feature in the Conseal Trust Center is designed to answer one of these:

1. **Why was this redacted?** (Explainability)
2. **Why wasn't this redacted?** (Near Misses)
3. **Can I prove it is actually removed?** (Mechanical Verification)
4. **Can I change the decision?** (Human-in-the-Loop Overrides)

---

## ✨ Key Features

* **Intelligent PII Detection**: Powered by Microsoft Presidio, the engine detects Names, Phones, Emails, Addresses, SSNs, Dates, and Organizations with high accuracy.
* **Explainable AI Rationales**: Every single detection comes with a plain-text rationale explaining exactly *why* the AI made its decision.
* **Near Miss Detection**: The AI explains what it decided *not* to redact (e.g., public organizations or dates), ensuring nothing was accidentally missed.
* **Human-in-the-Loop (HITL) Overrides**: Users have full control. You can override any AI decision, switch redactions on/off, and provide a human reason for the audit log (e.g., "False Positive", "Intentional Disclosure").
* **Mathematical Verification**: Before a document can be exported, the system runs a strict string-matching algorithm against the newly generated file to mathematically guarantee that the redacted PII strings no longer exist anywhere in the document text.
* **Multi-Format Support**: Upload, preview, and natively redact **PDF**, **DOCX**, and **TXT** files.
  * *Note: PDFs are permanently redacted by mathematically intersecting black boxes with the text layer, physically stripping the underlying characters.*

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: React 18, Vite, TypeScript
* **Styling**: Tailwind CSS (custom glassmorphism, enterprise UI design)
* **Animations**: Framer Motion (premium micro-interactions, staggered checklists)
* **Document Rendering**: `react-pdf` (pdf.js)

### Backend
* **Framework**: FastAPI (Python)
* **NLP / AI Engine**: Microsoft Presidio (`AnalyzerEngine`, spaCy)
* **Document Processing**: `PyMuPDF` (fitz) for PDFs, `python-docx` for Word documents.
* **Architecture**: Stateless, in-memory processing. No user documents are persisted in a database, ensuring strict data privacy.

---

## 🚀 Setup & Installation

### Prerequisites
* Python 3.9+
* Node.js 18+
* npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/Gnanesh-12/Sprintfour-Hackathon---Gnanesh.git
cd Sprintfour-Hackathon---Gnanesh
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_lg
```
Start the FastAPI server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`.

---

## 📖 How It Works (The Workflow)

1. **Upload**: Drag and drop your PDF, DOCX, or TXT file into the secure upload zone.
2. **Analysis Pipeline**: The backend extracts the raw text and runs it through the Presidio NLP engine. Entities are scored based on confidence. High-confidence items are auto-redacted; low-confidence items are flagged for manual review.
3. **Workspace Review**: You are taken to the dual-pane Workspace. On the left, the original document. On the right, a live preview of the redactions. 
4. **Inspect & Override**: Use the right-hand panel to inspect the "Trust Summary". Click on any "Needs Review" or "Near Miss" entity to read the AI's rationale. If you disagree, click "Override Decision".
5. **Verify & Export**: Once satisfied, proceed to Verification. The system will mathematically prove the PII is gone. If the checks pass, you can securely download the final document.

---

## 🔒 Security & Privacy
The Conseal Trust Center operates entirely locally. It does not send your documents to external cloud LLMs (like OpenAI or Anthropic). All NLP processing happens locally via spaCy and Presidio, and files are processed strictly in-memory or in temporary directories that are immediately cleaned up. No databases are used to store your sensitive data.

---

*Built with ❤️ for privacy and explainable AI.*