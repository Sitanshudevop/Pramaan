# Code Quality Standards: Pramaan

The goal is code that a stranger (a judge, a reviewer, or me in six months) can **read, run, trust and change** quickly. These rules apply to every commit, including code written with AI assistance. If a rule must be broken, explain why in the pull request or commit message.

---

## 1. Principles

1. **Readability over cleverness.** Boring, obvious code wins.
2. **One job per unit.** One responsibility per function, module and component.
3. **Pure core, thin edges.** Check logic is pure functions; I/O (HTTP, database, AI) lives at the edges.
4. **Types are documentation.** Everything is typed; invalid states should be hard to represent.
5. **Fail loudly in development, gracefully in production.** Clear errors for developers, friendly messages for users.
6. **Tests prove behaviour,** not implementation. The core loop always has a test.
7. **No dead code, no commented-out code, no TODO without an owner and a reason.**
8. **AI-generated code is reviewed like any other code.** Nothing is merged unread.

## 2. Architecture and structure

```
routers (HTTP only)  →  services (business rules)  →  repositories (database)
                              ↓
                     checks / ai (pure logic, adapters)
```

- **Routers** validate input, call one service function, return a schema. No business logic, no SQL.
- **Services** hold workflow rules (status transitions, approval gates, versioning).
- **Repositories** are the only place that touches the database.
- **Checks** (`checks/*.py`) are pure: `(text, rules, facts) -> list[Finding]`. No network, no database, no globals, no randomness.
- **AI adapter** (`ai/`) is an interface (`AIProvider`) with `GeminiProvider` and `NullProvider`; the rest of the code never imports a vendor SDK directly.
- **Frontend:** `pages/` (one file per route), `components/` (reusable UI), `lib/` (API client, utilities), `content/` (typed static text for Plan pages), `styles/` (tokens). Pages compose components; components do not fetch data directly unless they are explicitly data components.
- No circular imports. Dependencies point inward (routers depend on services, never the reverse).

## 3. Size and complexity limits

| Item | Limit |
|---|---|
| Function or method | about 40 lines, 1 level of nesting preferred (max 3) |
| Cyclomatic complexity (Python) | 10 or less (`ruff` rule `C901`) |
| File | about 300 lines; split by responsibility when larger |
| React component | about 150 lines; extract hooks and subcomponents |
| Function parameters | 4 or fewer; otherwise pass a typed object |
| Line length | 100 characters |

## 4. Naming and style

- **Python:** `snake_case` functions and variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants. Names say what, not how (`find_banned_terms`, not `process_text_2`).
- **TypeScript:** `camelCase` values, `PascalCase` components and types, `kebab-case` file names for non-components, component files named after the component.
- Booleans read as questions (`is_active`, `hasLockedPhrases`).
- No abbreviations except universal ones (`id`, `url`, `api`).
- **No magic numbers or strings.** Limits, thresholds and labels live in a `constants` module (for example `MAX_CONTENT_CHARS = 20_000`, severity and status enums).
- Use enums or literal union types for statuses and severities (`Blocker | Major | Minor | Info`; `Supported | Contradicted | Unsupported | Needs human judgement | Not checked`). Never raw strings scattered around.
- Prefer early returns over deep nesting. Prefer explicit over implicit.

## 5. Typing and validation

- **Python:** full type hints on all public functions; `mypy --strict` passes (or documented, narrow ignores). Pydantic v2 models for all request/response and finding objects; `extra="forbid"`.
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`; **no `any`** (use `unknown` and narrow). API responses validated with Zod at the boundary.
- Single source of truth for shapes: backend schemas are mirrored by frontend Zod schemas (generate or keep side by side and tested).

## 6. Comments and documentation

- Comments explain **why**, not what. If a comment explains what the code does, rename or restructure instead.
- Every module has a one-line docstring/header saying its purpose. Every public function has a short docstring (Python) or TSDoc (TS) that states inputs, outputs and failure modes.
- Non-obvious decisions (for example "why BM25 only in Round 2") go in `docs/ARCHITECTURE.md`, not in scattered comments.
- Keep `README.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES_COMPLETED.md` and `docs/CHANGES_FROM_PLAN.md` accurate. Documentation that is wrong is worse than none.

## 7. Error handling and logging

- Raise specific, named exceptions (`RuleNotFoundError`, `PermissionDeniedError`); catch only what you can handle; never use bare `except`.
- Return a consistent error shape from the API: `{ "error": { "code": "...", "message": "..." } }`. User messages are friendly; developer detail goes to logs.
- External calls (AI, file parsing) have timeouts, bounded retries and a fallback path. A failing AI call must never break the review.
- Structured logging (JSON): include request ID, route, status, duration. **Never log draft content, keys or personal data.**
- Frontend: error boundary per page; empty, loading and error states are designed, not afterthoughts.

## 8. Tooling (enforced automatically)

| Area | Tools | Rule |
|---|---|---|
| Python lint and format | `ruff check`, `ruff format` | Rule sets: `E,F,I,B,C90,UP,S,SIM,PL` (security `S` included); zero warnings |
| Python types | `mypy --strict` | Zero errors |
| Python tests | `pytest`, `pytest-cov` | See coverage targets below |
| TS lint and format | `eslint` (typescript-eslint, react-hooks, jsx-a11y), `prettier` | Zero warnings |
| TS types | `tsc --noEmit` | Zero errors |
| TS tests | `vitest`, Testing Library | Component and utility tests |
| End to end | Playwright smoke test (+ `axe` accessibility check) | Core loop passes |
| Hooks | `pre-commit` (ruff, prettier, eslint, gitleaks, trailing-whitespace) | Runs before every commit |
| CI | GitHub Actions | Lint, type-check, test, audit and build on every push and pull request; red CI blocks merging |

## 9. Testing standards

**Pyramid:** many fast unit tests of pure checks; some API tests; one end-to-end test of the core loop.

- **Unit tests** for every check function: at least one positive case, one negative case and one edge case (quoted text, casing, punctuation, empty input, very long input).
- **Golden set** (`backend/tests/golden/`): at least 20 labelled drafts, including **clean drafts** to measure false positives. Report precision and recall from real runs only. Never publish a number that was not measured.
- **Security tests** exist as listed in `SECURITY.md` (role matrix, injection, hallucination guard, PII redaction, Confidential Mode).
- **Workflow tests:** every legal status transition passes; every illegal one is rejected.
- **Accessibility:** automated `axe` run on key pages in both light and dark themes; manual keyboard pass before submission.
- **Coverage targets:** 85% or more on `checks/` and `services/`; 70% or more overall. Coverage is a floor, not a goal; do not write assertion-free tests to hit a number.
- Tests are deterministic: no real network calls (mock the AI provider), no dependence on the clock without injecting it, no shared mutable state.

## 10. Frontend quality rules

- **Design tokens only.** Colours, spacing, radius and type scale come from CSS variables/Tailwind tokens; no hard-coded hex values in components.
- Both themes (light and dark) are checked for every new component; contrast meets WCAG AA (4.5:1 for text).
- Semantic HTML first (`button`, `nav`, `main`, headings in order); ARIA only when semantics are not enough.
- Every interactive element is keyboard reachable with a visible focus ring; status is never conveyed by colour alone.
- One H1 per page; one page = one topic.
- Server data via TanStack Query; local UI state via React state; avoid global state unless necessary.
- No inline styles for layout; no unused CSS; no `console.log` in committed code.
- Respect `prefers-reduced-motion`; keep animations to short fades.

## 11. Git workflow

- **Public repository from the first commit.** The commit history is evidence of work done inside the permitted build window; do not rewrite or squash it away.
- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`, `perf:`, `security:`.
- Small, focused commits (one idea each); a commit message states **what and why** in 72 characters for the subject.
- Branches: `main` is always deployable; work on short-lived feature branches and merge via pull request (even solo) so CI runs.
- Never commit secrets, `.env`, database files, `node_modules`, build output or large binaries. `.gitignore` is set up before the first commit.
- Tag the submission build (for example `round2-submission`).

## 12. Pull request and commit checklist

Before every merge:

- [ ] Lint, format, type-check and tests pass locally and in CI.
- [ ] New logic has tests (including at least one failure case).
- [ ] No `any`, no commented-out code, no stray `print`/`console.log`, no TODO without a reason.
- [ ] No secrets, personal data or real brand data in code, fixtures or logs.
- [ ] Permission checks and input validation added for any new endpoint.
- [ ] UI checked in **light and dark**, at mobile and desktop widths, and by keyboard.
- [ ] Docs updated if behaviour, setup or limitations changed.
- [ ] `docs/FEATURES_COMPLETED.md` ticks only what truly works.

## 13. Definition of done (per feature)

A feature is done when it is: **implemented**, **typed**, **validated**, **permission-checked**, **tested**, **accessible**, **themed (light and dark)**, **documented**, **logged without sensitive data**, and **demonstrable from the deployed link without a walkthrough**.

## 14. Dependencies and licences

- Add a dependency only when it removes real complexity; prefer the standard library and existing dependencies.
- Pin versions; commit lockfiles; run audits (see `SECURITY.md`).
- Use only permissively licensed libraries (MIT, Apache-2.0, BSD). Record each library, API, model and template with its licence in `docs/AI_AND_TOOLS_DISCLOSURE.md`.

## 15. Disclosure and honesty in code and docs

- AI assistance (the Antigravity IDE with Gemini) and the runtime AI service are **disclosed** in `docs/AI_AND_TOOLS_DISCLOSURE.md`, the README and the in-product disclosure panel.
- Seed data is **fictional** and labelled so in the UI and files.
- Metrics in docs come from measured runs. If something is a target, it is labelled a target. If a feature is not built, it is labelled planned.
- Known limitations are listed in the README and `SECURITY.md`, not hidden.

## 16. Quality gate before submission

- [ ] CI green on `main`; the live deployment matches the tagged commit.
- [ ] Every submitted link opens in a **private/incognito window** without sign-in.
- [ ] Core loop completed from scratch on the live URL by a person who has never seen the app.
- [ ] Fresh clone runs with the documented commands (`README.md`) in under 10 minutes.
- [ ] Lighthouse accessibility check and `axe` show no critical issues in both themes.
- [ ] `SECURITY.md`, `CODE_QUALITY.md`, README and docs reflect reality.
- [ ] No secrets in the repository history (secret scan clean).
