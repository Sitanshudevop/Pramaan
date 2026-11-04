# Features Completed Checklist

This checklist honestly tracks what is implemented, verified, and active in the codebase. Items are only checked `[x]` when fully implemented, tested, and verifiable by judges.

---

## 1. Core Review Loop (P0)
- [ ] Brand Kit Selection (Kettle & Co., LedgerLeaf)
- [ ] Purpose Card Form (Goal, Audience, Key Message, CTA, Locked Phrases, Content Type, AI Declaration)
- [ ] One-Click "Use Sample" pre-population for all test drafts
- [ ] Text Submission (Up to 20,000 characters with client & server validation)
- [ ] Deterministic Check Engine (Pure functions, zero external dependencies)
  - [ ] Terminology rules (Banned terms, case-insensitivity, product casing, en-IN spelling)
  - [ ] Messaging rules (Mandatory lines and disclaimer verification)
  - [ ] Promotional claims checks (Superlatives, absolutes, health claims, eco claims)
  - [ ] Facts register comparator (Values, units, validity dates, stale fact warnings)
  - [ ] Purpose card verification (Locked phrases preservation, CTA presence)
  - [ ] Accessibility text checks (Reading level target, vague links, all-caps shouting)
  - [ ] AI & Sponsored content disclosure checks
- [ ] Source-Linked Findings Display (Category, status, severity, excerpt highlight, rule ID, source title, confidence, method)
- [ ] Purpose-Preserving Suggestions with inline before/after diffs
- [ ] Finding Actions: Accept, Edit, Dismiss (reason mandatory), Ask Reviewer
- [ ] Content Revision & Automatic Re-checking on Edit/Accept
- [ ] Version History & Diff View between drafts
- [ ] Review Routing Workflow (Draft → Submitted → AI-reviewed → Changes requested ↔ Revised → In human review → Approved / Rejected → Exported)
- [ ] Human Decision Enforcement (Reviewer comment/override; Brand Manager approval gate)
- [ ] Downloadable Approval Certificate with cryptographic hash & legal disclaimer
- [ ] Append-only Audit Trail & AI Disclosure Ledger

---

## 2. Information Architecture & Navigation
- [ ] Left Navigation Sidebar (collapsible drawer on mobile)
- [ ] Group A: Product Pages
  - [ ] `/` Home (Hero, 3 commitments, sample review CTA, Brand Hub CTA)
  - [ ] `/app/new` New Review
  - [ ] `/app/review/:id` Review & Findings Workspace
  - [ ] `/app/queue` Risk-Sorted Review Queue
  - [ ] `/app/hub` Brand Knowledge Hub (Rules, Facts Register, Glossary, Claims Policy)
  - [ ] `/app/audit` Audit Trail & AI Disclosure Ledger
  - [ ] `/app/insights` Calm Brand Insights (Repeated violations, override trends, ambiguity scores)
- [ ] Group B: Static Plan Pages (13 dedicated routes built from `docs/PRAMAAN_CONTENT.md`)
  - [ ] `/plan/summary`
  - [ ] `/plan/problem`
  - [ ] `/plan/evidence`
  - [ ] `/plan/users`
  - [ ] `/plan/solution`
  - [ ] `/plan/workflow`
  - [ ] `/plan/scope`
  - [ ] `/plan/technical`
  - [ ] `/plan/responsible`
  - [ ] `/plan/positioning`
  - [ ] `/plan/feasibility`
  - [ ] `/plan/delivery`
  - [ ] `/plan/references`
- [ ] Persistent "Demo data is fictional" header badge
- [ ] Global Theme Toggle (Light / Dark / System with zero-flash early initialization)
- [ ] Demo Role Switcher (`Creator`, `Reviewer`, `Brand manager`, `Admin`)
- [ ] Global 404 & Error Boundary

---

## 3. Security, Resilience & Privacy (P1)
- [ ] Server-side role enforcement via `X-Demo-Role` and `require(permission)`
- [ ] Server-side input limits (20k chars, 5MB upload, 2k chars comment, 500 chars reason)
- [ ] PII Redaction Gateway (Regex for emails, phone numbers, digit sequences before AI egress)
- [ ] Confidential Mode toggle (Sever external AI calls, fall back to pure rule engine)
- [ ] Google Gemini Provider with `AIProvider` abstraction & `NullProvider` fallback
- [ ] Hallucination & Citation Verifier (Code-based proof-or-abstain guard)
- [ ] Rate limiting on review and upload endpoints (`slowapi`)
- [ ] Security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options)
- [ ] Safe React rendering without `dangerouslySetInnerHTML` for untrusted text

---

## 4. Multi-modal / Asset Parsing (P1/P2)
- [ ] Image upload handling (Pillow: alt-text presence check, relative luminance WCAG contrast ratio check)
- [ ] Plain text & Markdown file drop support
