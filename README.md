# Pramaan (प्रमाण)
### Evidence-Backed Brand Governance Platform for Pre-Publication Content Review

[![CI](https://github.com/Sitanshudevop/Pramaan/actions/workflows/ci.yml/badge.svg)](https://github.com/Sitanshudevop/Pramaan/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.4_Strict-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> *"Every finding has evidence. Every correction preserves the creator’s purpose. Every final decision remains human."*

---

## 1. What is Pramaan?

**Pramaan** (Hindi for *“proof, evidence”*) is a pre-publication brand-governance web platform developed for **CodeNexus India 2026 Round 2 (The Build)** by team **DOOM_CODER** (Solo participant: Sitanshu Kumar).

Modern brand content is authored by distributed teams, agencies, and generative AI. Traditional brand books sit unopened in PDFs while outdated prices, unverified claims, tone drift, and accessibility violations reach production.

Pramaan replaces post-publication damage control with an **evidence-or-abstain** pre-flight workspace:
1. **Proof for every finding:** 100% of displayed findings cite a verified Rule ID or Fact ID. In the absence of an approved source, Pramaan abstains (`Unsupported` or `Needs human judgement`).
2. **Intent-preserving suggestions:** Corrections are generated with locked key phrases and re-verified against the original rule and Creator Purpose Card.
3. **Living brand knowledge & ambiguity radar:** Overrides and reviewer disagreements are tracked to highlight vague guidelines and propose clearer wording.
4. **Zero-login role switching:** Full multi-role governance (`Creator`, `Reviewer`, `Brand manager`, `Admin`) testable in an incognito window with server-side permission gates.
5. **Works without an AI key:** Pure deterministic rules produce genuine findings; graceful degradation if `GEMINI_API_KEY` is omitted or in Confidential Mode.

---

## 2. 5-Step Demo Walkthrough (for Judges)

You can test Pramaan immediately in any browser (including Incognito) with **zero login**:

1. **Step 1: Open the App & Choose a Sample**
   - Navigate to `/` (Home) or click **New Review** (`/app/new`).
   - Click one of the one-click sample buttons (e.g. *"Sample 1: Kettle & Co. Chai"* or *"Sample 3: LedgerLeaf Fintech"*).
   - Notice how the **Brand Kit**, **Content**, and **Creator Purpose Card** (Goal, Audience, Key Message, Call to Action, and Locked Phrases) auto-populate.
2. **Step 2: Run Review & Inspect Evidence Cards**
   - Click **Run Brand Review**.
   - Review findings load in milliseconds. Each card displays:
     - Exact flagged excerpt with character offsets.
     - Severity badge (`Blocker`, `Major`, `Minor`, `Info`).
     - Verification method (`DETERMINISTIC`, `AI`, or `HYBRID`) and confidence percentage.
     - **Exact evidence citation** (e.g., `CLAIM-1.1`, `TERM-001`, `F-01`).
3. **Step 3: Accept a Purpose-Preserving Fix & Review Diff**
   - Inspect the inline suggestion on a finding.
   - Click **Accept Suggestion**. Notice:
     - A new draft version (v2) is spawned.
     - The checks automatically re-run on v2.
     - The locked phrases from your Purpose Card remain intact.
     - An inline unified diff highlights exactly what changed.
4. **Step 4: Switch Roles & Enforce Governance Gates**
   - In the top header bar, switch the **Role Switcher** from `Creator` to `Reviewer` or `Brand manager`.
   - As a `Reviewer`, add a review comment or override a finding (mandatory reason required).
   - As a `Brand manager`, approve the review. (If a `Blocker` exists, Pramaan prevents unauthorized lower-role sign-off).
5. **Step 5: Download Certificate & Inspect Audit Trail**
   - Click **Download Certificate** to receive the tamper-evident JSON/PDF record.
   - Note the clear disclaimer: *"Approval records a human decision; it is not a legal compliance certification."*
   - Navigate to **Audit & Disclosure** (`/app/audit`) to inspect the append-only audit trail and the AI & PII disclosure ledger.

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.12+ (or 3.11+)
- Node.js 18+ and npm
- (Optional) `GEMINI_API_KEY` in environment for live Gemini 2.5 Flash calls. If unset, Pramaan runs in deterministic fallback mode.

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/Sitanshudevop/Pramaan.git
cd Pramaan

# Create and activate virtual environment
python -m venv backend/venv
# Windows:
backend\venv\Scripts\activate
# Linux/macOS:
# source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend API server (runs on http://localhost:8000)
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 4. One-Command Docker Run

You can also run the full stack with Docker Compose:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript (Strict), Vite, Tailwind CSS | High-performance, zero-friction pre-publication workspace |
| **State & Query** | TanStack React Query v5 | Optimistic UI updates, caching, automatic invalidation |
| **Icons & Design** | Lucide React | Minimalist, calm editorial iconography |
| **Backend Framework** | FastAPI (Python 3.12), Pydantic v2 (`extra="forbid"`) | High-speed async API, strict schema validation |
| **ORM & Database** | SQLAlchemy 2.0, SQLite (`pramaan.db`) | Single-file zero-dependency database seeded on startup |
| **Grounding & NLP** | `rank_bm25`, `textstat`, custom PII regex gateway | Deterministic rule matching, readability scoring, PII redaction |
| **AI Integration** | Google Gemini API (Gemini 2.5 Flash) | Retrieval-augmented advisory judgement behind code verifier |
| **Security** | `slowapi` rate limits, strict CSP & security headers | Production-grade perimeter protection |

---

## 6. Architecture & Grounding Pipeline

```mermaid
flowchart TD
    A["Draft Intake & Purpose Card"] --> B["Deterministic Rules Engine"]
    A --> C["PII Redaction Gateway"]
    C --> D["BM25 Knowledge Base Search"]
    D --> E["Gemini 2.5 Flash Advisory"]
    E --> F["Code-Level Proof Verifier"]
    B --> G["Findings Aggregator & Re-checker"]
    F --> G
    G --> H["Explainable Cards with Proof IDs"]
    H --> I["Human Decision Gate (Creator / Reviewer / Manager)"]
    I --> J["Approval Certificate & Append-only Audit Log"]
```

---

## 7. Submission & Governance Documentation

All required submission documents are stored in `/docs` and accessible within the app:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Architectural diagram, data pipeline, design decisions, and threat model.
- [`docs/FEATURES_COMPLETED.md`](docs/FEATURES_COMPLETED.md): Honest feature-by-feature verification matrix.
- [`docs/CHANGES_FROM_PLAN.md`](docs/CHANGES_FROM_PLAN.md): Log of adjustments made between Round 1 and Round 2.
- [`docs/ROUND3_IMPROVEMENTS.md`](docs/ROUND3_IMPROVEMENTS.md): Committed improvements for Round 3 (The Finish).
- [`docs/AI_AND_TOOLS_DISCLOSURE.md`](docs/AI_AND_TOOLS_DISCLOSURE.md): Complete disclosure of all AI models, tools, and libraries used.
- **Plan & Project Scope:** Plan pages replaced by a single About page (`/about`) to keep the product user-focused; the full plan is in the submitted PDF and [`docs/PRAMAAN_CONTENT.md`](docs/PRAMAAN_CONTENT.md).

---

## 8. Open Disclosures & Known Limitations

1. **Advisory Tool:** Pramaan is designed to augment human reviewers, not replace legal or regulatory counsel.
2. **Pass Sentence:** *"A pass means only that no issue was detected by the checks performed."*
3. **Approval Notice:** *"Approval records a human decision; it is not a legal compliance certification."*
4. **Fictional Demo Data:** Brand kits for *Kettle & Co.* and *LedgerLeaf*, including all simulated events, are entirely fictional.

---

## 9. Author & Team Information

- **Team Name:** DOOM_CODER
- **Team Size:** Solo participant
- **Team Lead:** Sitanshu Kumar
- **Affiliation:** B.Tech Computer Science Engineering (2024–2028), Rungta International Skill University, Durg, Chhattisgarh
- **Event:** CodeNexus India 2026 — Round 2 (The Build)

