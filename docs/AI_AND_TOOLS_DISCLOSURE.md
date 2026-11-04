# AI and Tools Disclosure

In accordance with CodeNexus India 2026 rules and Section 13/15 of `PROMPT_ANTIGRAVITY.md`, this document provides complete, transparent disclosure of all AI assistants, models, runtime APIs, and third-party open-source libraries used in the development and execution of **Pramaan**.

---

## 1. Development-Time AI Assistance

- **Agentic IDE & Assistant:** Google Antigravity IDE powered by Gemini 3.8 Flash (High).
- **Scope of Use:** Pair programming, boilerplate scaffolding, unit test authoring, frontend component drafting, documentation structuring, and automated lint/test fix iterations.
- **Human Oversight:** All architectural decisions, security boundaries, rule logic definitions, schema validations, and review determinations are directed and reviewed by Sitanshu Kumar (Team Lead, DOOM_CODER).

---

## 2. Runtime AI Services

| Service / Provider | Model | Purpose | Data Protection & Redaction |
|---|---|---|---|
| **Google Gemini API** (via `GeminiProvider`) | `gemini-1.5-flash` | Secondary tone, nuance, and semantic claim verification | All PII (emails, phone numbers, Aadhaar/ID numbers) is redacted via regex *before* dispatch. Zero prompt instructions accepted from content (`<<<CONTENT>>>` data demarcation). External call disabled when Confidential Mode is ON or when `GEMINI_API_KEY` is unset. |
| **NullProvider** (Fallback) | None (Local Rule Engine) | Primary deterministic verification | 100% offline. Zero external network egress. Runs when AI key is missing or Confidential Mode is enabled. |

---

## 3. Open-Source Libraries & Licences

### Backend (Python)
- `fastapi` - MIT License
- `uvicorn` - BSD-3-Clause License
- `pydantic` - MIT License
- `sqlalchemy` - MIT License
- `rank-bm25` - Apache-2.0 License
- `textstat` - MIT License
- `slowapi` - MIT License
- `httpx` - BSD-3-Clause License
- `pillow` - HPND License (permissive)
- `pytest` & `pytest-cov` - MIT License
- `ruff` - MIT / Apache-2.0 License
- `mypy` - MIT License

### Frontend (TypeScript / React)
- `react` & `react-dom` - MIT License
- `vite` - MIT License
- `typescript` - Apache-2.0 License
- `tailwindcss` - MIT License
- `react-router-dom` - MIT License
- `@tanstack/react-query` - MIT License
- `zod` - MIT License
- `lucide-react` - ISC License (permissive)
- `clsx` & `tailwind-merge` - MIT License
- `canvas-confetti` (for approval celebrations) - ISC License

---

## 4. Fictional Data Disclosure

All brand kits (`Kettle & Co.`, `LedgerLeaf`), brand rules, guidelines, facts register entries, sample draft content, and simulated reviewer events are entirely fictional and authored specifically for the CodeNexus 2026 hackathon demonstration. Any resemblance to real commercial entities or living individuals is purely coincidental.
