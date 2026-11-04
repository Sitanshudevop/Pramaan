# Changes From Round 1 Plan

This document records all deviations, architectural adjustments, and deliberate tradeoffs made between the original Round 1 concept document and this Round 2 build. Every change is documented with its technical rationale and risk mitigation.

---

| Item | Round 1 Plan | Round 2 Implementation | Reason & Tradeoff |
|---|---|---|---|
| **Database** | PostgreSQL with `pgvector` | SQLite (single-file DB, pre-seeded on startup, JSON export/import) | Zero external database infrastructure dependency for the 72-hour build and judges. Eliminates hosting cold-start DB crashes. Fast, deterministic, testable in-memory. |
| **Retrieval Engine** | Hybrid dense vector retrieval + BM25 | BM25 (`rank_bm25`) over active, approved rules and facts only | Vector search introduces vector embeddings latency and external model dependencies. BM25 is fully deterministic, explainable, runs locally without API keys, and has zero cold-start delay. |
| **Authentication & Sessions** | JWT with Argon2 password hashing | Demo role switcher (`Creator`, `Reviewer`, `Brand manager`, `Admin`) sent via `X-Demo-Role` header | Per Section 1 of build instructions: non-negotiable acceptance rule is "No login" so judges land in incognito and test the core loop immediately. Server-side permission enforcement is fully active per role. |
| **Asynchronous Task Queue** | Redis with RQ or Celery workers | Synchronous pipeline execution with strict 10s timeout and circuit breaker | Eliminates Redis broker dependency. Avoids worker queue desynchronization or background job dropouts during quick judge evaluations. |
| **Hosted AI Model** | Provider-selectable multi-LLM engine | Google Gemini 1.5 Flash via a clean `AIProvider` adapter interface | High structured-JSON fidelity, fast response times (<2s), low cost, reliable schemas. Adapter pattern cleanly isolates provider so swap is trivial. |
| **Confidential Mode** | Local quantized model (e.g., Llama 3 via Ollama) | Deterministic-only execution mode (all external API calls severed; rule engine remains 100% operational) | Local LLM execution requires heavy GPU memory not guaranteed in CI or judge container/local setups. Deterministic engine provides 100% privacy with zero data leaving the host. |
| **Agency External Role** | Dedicated external agency role with sandboxed asset permissions | Deferred to Round 3 | Reduced role complexity for Round 2. Replaced with core 4 roles: Creator, Reviewer, Brand Manager, Admin. |
| **Image & Document Extraction** | OCR via Tesseract + multi-page layout parsing | Text/Markdown paste (P0), Pillow-based metadata/palette/contrast checks, PyMuPDF / python-docx (P1) | Kept text core loop protected first. Sandboxed parsing with size and MIME validation ensures security against parser exploits. |

