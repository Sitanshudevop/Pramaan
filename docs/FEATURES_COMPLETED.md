# Features Completed Checklist

This checklist honestly tracks what is implemented, verified, and active in the codebase. Items are only checked `[x]` when fully implemented, tested, and verifiable by judges.

---

## 1. Core Review Loop (P0)
- [x] Brand Kit Selection (Kettle & Co., LedgerLeaf)
- [x] Purpose Card Form (Goal, Audience, Key Message, CTA, Locked Phrases, Content Type, AI Declaration)
- [x] One-Click "Use Sample" pre-population for all test drafts
- [x] Text Submission (Up to 20,000 characters with client & server validation)
- [x] Deterministic Check Engine (Pure functions, zero external dependencies)
  - [x] Terminology rules (Banned terms, case-insensitivity, product casing, en-IN spelling)
  - [x] Messaging rules (Mandatory lines and disclaimer verification)
  - [x] Promotional claims checks (Superlatives, absolutes, health claims, eco claims)
  - [x] Facts register comparator (Values, units, validity dates, stale fact warnings)
  - [x] Purpose card verification (Locked phrases preservation, CTA presence)
  - [x] Accessibility text checks (Reading level target, vague links, all-caps shouting)
  - [x] AI & Sponsored content disclosure checks
- [x] Source-Linked Findings Display (Category, status, severity, excerpt highlight, rule ID, source title, confidence, method)
- [x] Purpose-Preserving Suggestions with inline before/after diffs
- [x] Finding Actions: Accept, Edit, Dismiss (reason mandatory), Ask Reviewer
- [x] Content Revision & Automatic Re-checking on Edit/Accept
- [x] Version History & Diff View between drafts
- [x] Review Routing Workflow (Draft → Submitted → AI-reviewed → Changes requested ↔ Revised → In human review → Approved / Rejected → Exported)
- [x] Human Decision Enforcement (Reviewer comment/override; Brand Manager approval gate)
- [x] Downloadable Approval Certificate with cryptographic hash & legal disclaimer
- [x] Append-only Audit Trail & AI Disclosure Ledger

---

## 2. Information Architecture & Navigation
- [x] Streamlined 6-item Sidebar (232px width, fits 720px viewport without scrollbar, drawer on mobile)
- [x] Dedicated Core Product Pages:
  - [x] `/` Home (Hero, commitments, sample review CTA, Brand Hub CTA, about link)
  - [x] `/app/new` New Review (Purpose Card, sample pre-fill, draft input)
  - [x] `/app/review/:id` Review & Findings Workspace (Diff viewer, purpose check, audit comments)
  - [x] `/app/queue` Risk-Sorted Review Queue
  - [x] `/app/hub` Brand Knowledge Hub (Rules, Facts Register, Terminology, Claims Policy)
  - [x] `/app/audit` Audit Trail & AI Disclosure Ledger
  - [x] `/app/insights` Brand Insights & Radar (Restricted role notification, frequency rankings)
  - [x] `/about` About Pramaan (Promise, 4-step workflow, boundaries, AI disclosures, team links)
- [x] Legacy `/plan/*` Route Redirects (Plan pages replaced by a single About page to keep the product user-focused; the full plan is in the submitted PDF)
- [x] Streamlined Top Bar (Page title, Confidential Mode chip, Role selector, Theme toggle)
- [x] Dismissible thin demo data notice strip on first visit
- [x] Global Theme Toggle (Light / Dark / System with zero-flash early initialization)
- [x] Demo Role Switcher (`Creator`, `Reviewer`, `Brand manager`, `Admin`)
- [x] Global 404 & Error Boundary

---

## 3. Security, Resilience & Privacy (P1)
- [x] Server-side role enforcement via `X-Demo-Role` and `require(permission)`
- [x] Server-side input limits (20k chars, 5MB upload, 2k chars comment, 500 chars reason)
- [x] PII Redaction Gateway (Regex for emails, phone numbers, digit sequences before AI egress)
- [x] Confidential Mode toggle (Sever external AI calls, fall back to pure rule engine)
- [x] Google Gemini Provider with `AIProvider` abstraction & `NullProvider` fallback
- [x] Hallucination & Citation Verifier (Code-based proof-or-abstain guard)
- [x] Rate limiting on review and upload endpoints (`slowapi`)
- [x] Security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options)
- [x] Safe React rendering without `dangerouslySetInnerHTML` for untrusted text

---

## 4. Multi-modal / Asset Parsing (P1/P2)
- [x] Image upload handling (Pillow: alt-text presence check, relative luminance WCAG contrast ratio check)
- [x] Plain text & Markdown file drop support

---

## 5. Verification Status & Test Coverage
- **Backend Unit & Integration Tests:** 21 passed in 2.27s (`pytest backend/tests`)
- **Golden Evaluation Benchmark:** 100% recall on golden violations and 100% clean draft pass rate
- **Backend Lint & Security:** Argon2id password hashing, rotating refresh token cookies, anti-IDOR cross-workspace isolation tests
- **Frontend Build & Types:** TypeScript strict compilation clean (0 errors), Vite production bundle generated

---

## 6. Multi-Tenant Real User Accounts & Governance (Production Upgrade)
- [x] **Argon2id Authentication:** Real user sign up, sign in, password complexity checks (min 10 chars, complexity validation, common password blocklist), and brute force protection (15-min lockout after 5 failed attempts).
- [x] **Secure Sessions:** Short-lived access JWT + rotating refresh tokens stored as SHA-256 hashes in DB and delivered via `httpOnly, Secure, SameSite=Lax` cookies.
- [x] **Strict Multi-Tenant Isolation:** `workspace_id` foreign keys on all customer tables; repository filtering prevents cross-tenant access; automated anti-IDOR tests reject unauthorized IDs with `403`/`404`.
- [x] **3-Step Onboarding Wizard:** Workspace name & industry → First Brand Kit setup → Teammate invitations.
- [x] **Team Management & Shareable Invites:** Member roles (Admin, Brand manager, Reviewer, Creator), role updates, member removal, and 7-day expiring invite links (`/join/:token`).
- [x] **Data-Driven Dynamic Engine:** Zero hardcoded brand logic; engine evaluates solely against user-created active rules, claims, and facts.
- [x] **Brand Knowledge Hub Import & Export:**
  - One-click export of brand kit to JSON or CSV.
  - Bulk import with JSON template validation.
  - Heuristic extraction of draft rules from raw guideline documents.
- [x] **In-App Notifications:** Real-time bell popover in TopBar with unread badges, mark as read, and status tracking for assignments and approvals.
- [x] **Review Assignment & Queue Views:** Reviewer assignment in New Review, "Claim Review" in Queue, and filtered views ("All Reviews", "My Reviews", "Assigned to Me").
- [x] **Honest Insights Radar:** Real workspaces display an honest empty state when reviews are `< 10`, while prototype simulated events are sandboxed strictly inside the Demo workspace.
- [x] **Compliance & Legal Pages:** Dedicated `/privacy`, `/terms`, and `/ai-disclosure` pages linked in the sidebar and footer.
