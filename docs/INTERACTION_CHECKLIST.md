# Pramaan Interaction Inventory & Verification Checklist

This document catalogs every interactive element across Pramaan, its trigger, and its verified expected result.

---

## 1. Global Shell & Navigation

| Component | Element / Selector | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|---|
| **Logo** | `header a[href="/"]` or sidebar logo | Click | Navigates to `/` (Home), updates URL and view | None |
| **Hamburger Button** | `header button[aria-controls="app-navigation"]` | Click | **Desktop (≥1024px)**: Completely hidden (`display: none`, not focusable, removed from tab order).<br>**Below 1024px**: Placed at far left of top bar (44×44px touch target). Opens off-canvas drawer. Inside drawer, header row (Logo + "Pramaan" on left, Close button on right) sits directly above "Home". Drawer retains focus trap, Esc close, scrim tap, closes on selection, locks body scroll, and returns focus to hamburger on close. | None |
| **Desktop Sidebar** | `<aside id="app-navigation">` (240px) | Persistent | Persistent 240px full sidebar on desktop (≥1024px) with icons and text labels. Icon-rail/collapse mode and `localStorage` toggle removed entirely. Below 1024px, sidebar is hidden. | None |
| **Narrow TopBar (<640px)** | `header` | Layout | Compact mobile layout: `[hamburger] [page title, truncated] [bell] [avatar menu]`. Logo mark is suppressed in the top bar below 640px to prevent redundancy with the drawer header. | None |
| **TopBar Mobile Overflow** | `header button[aria-label="More options"]` | Click | Opens bottom sheet (<640px) or popover (640-1023px) containing workspace switcher, persona switcher, theme picker, and sign-in button | None |
| **Confidential Toggle** | TopBar button (Confidential Chip) | Click | Toggles Confidential Mode between ON and OFF; sends `X-Confidential-Mode` | None |
| **Demo Persona Switcher** | TopBar persona dropdown / select | Select / Click | Switches active persona (`Meera Kapoor`, `Anika Rao`, `Rohan Mehta`, `Dev Malhotra`, `Priya Nair`, `Imran Sheikh`); updates permissions and views | Demo workspace |
| **Theme Toggle** | TopBar button `[aria-label^="Cycle theme"]` | Click | Cycles theme between `light`, `dark`, and `system`; persists in localStorage | None |
| **Demo Notice Strip** | Dismiss button `[aria-label="Dismiss notice"]` | Click | Dismisses demo notice strip and persists dismissal in localStorage | None |

---

## 2. Home Page (`/`) & About Page (`/about`)

| Element | Trigger | Expected Result |
|---|---|---|
| **"Try a sample review" Button** | Click | Navigates directly to `/app/new` |
| **"Open Brand Hub" Button** | Click | Navigates directly to `/app/hub` |
| **Footer "About Pramaan" Link** | Click | Navigates directly to `/about` |
| **Hero 3D Floating Cards** | Hover / Tab | Purely decorative (`pointer-events: none`, `aria-hidden="true"`); never obstructs clicks |
| **About Accordion Cards** | Click | Expands/collapses section content (Promise, Workflow, Boundaries, Disclosures, Team) |
| **About External Links** | Click | Opens GitHub Repository or docs in new tab |

---

## 3. New Content Review Page (`/app/new`)

| Element | Trigger | Expected Result |
|---|---|---|
| **Sample 1 ("Kettle & Co.") Button** | Click | Populates Brand Kit dropdown, Purpose Card, and sample promotional text |
| **Sample 2 ("LedgerLeaf") Button** | Click | Populates Brand Kit dropdown, Purpose Card, and sample financial text |
| **Brand Kit PillSelect** | Select change | Updates selected brand kit and loads kit-specific rules |
| **Content Type PillSelect** | Select change | Updates content format metadata (`Promotional Email`, `Social Post`, etc.) |
| **Upload File (.txt, .md) Button** | File upload | Reads local file text directly into draft content editor |
| **Clear Form Button** | Click | Clears draft content and all Purpose Card fields |
| **Locked Phrases Tag Input** | Enter key / button | Adds custom locked phrase chip into the Purpose Card list |
| **AI Assistance Checkbox** | Toggle | Sets `ai_declared: true/false`, recorded in disclosure ledger |
| **"Run Review" Primary Button** | Click / Submit | Submits review to backend; navigates to `/app/review/:id` on completion |

---

## 4. Review & Findings Page (`/app/review/:id`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **"Certificate (HTML/PDF)" Link** | Click | Opens tamper-evident certificate in new tab via `/api/reviews/:id/certificate` | All roles |
| **"Request Changes" Button** | Click | Opens feedback modal; sets status to `Changes requested` with note | Reviewer, Brand manager & Admin |
| **"Reject" Button** | Click | Opens rejection modal; marks review as `Rejected` with reason | Brand manager & Admin |
| **"Ask Reviewer" Button** | Click | Prepares review inquiry on active finding | Creator only |
| **"Approve Review" Button** | Click | Opens approval modal; sets review status to `Approved` | Brand manager & Admin only; shows visible disabled tooltip for Creator/Reviewer |
| **"Edit Draft" Toggle Button** | Click | Opens inline draft editor in right pane | All roles |
| **"Save & Re-run Checks" Button** | Click | Creates new version snapshot, re-runs pure checks, displays updated findings | Creator, Reviewer, Manager |
| **PillTabs (Findings, Suggestions, History, Sources)** | Click / Arrow keys | Switches active view panel; focuses active tab | All roles |
| **Suggestions Tab: "Accept Suggestion"** | Click | Opens confirmation modal; applies unified diff fix | Creator, Reviewer, Manager |
| **Suggestions Tab: "Edit"** | Click | Opens modal with editable replacement text area | Creator, Reviewer, Manager |
| **History Tab: "Inspect v{v.version} Findings"** | Click | Switches workspace to view historic version's findings | All roles |
| **Grounding Sources: "View in Brand Hub"** | Click | Navigates to `/app/hub` with link to corresponding rule | All roles |
| **"Dismiss" Button** | Click | Opens modal requiring justification reason | Creator, Reviewer, Manager |
| **"Override Finding" Button** | Click | Opens override modal requiring justification reason | Reviewer & Manager only; visible disabled state for Creator |
| **Comments Form Input & Submit** | Type + Submit | Adds review comment to thread with actor role & timestamp | All roles |

---

## 5. Review Queue Page (`/app/queue`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **"New Review" Primary Button** | Click | Navigates to `/app/new` | All roles |
| **SearchPill** | Type query | Dynamically filters queue table by ID, kit, or role | All roles |
| **Status Filter PillSelect** | Select change | Filters queue by status (`Submitted`, `AI-reviewed`, `Approved`) | All roles |
| **Severity Filter PillSelect** | Select change | Filters queue by blockers or clean status | All roles |
| **"Quick Approve" Inline Button** | Click | Approves clean reviews (0 blockers) directly from queue row | Reviewer, Brand manager & Admin |
| **"Certificate" Download Icon** | Click | Downloads / opens proof certificate for approved drafts | All roles |
| **"Delete" Row Button** | Click | Confirms and deletes test review draft from queue | Brand manager & Admin |
| **Table Row / Mobile Card** | Click / Enter | Navigates directly to `/app/review/:id` | All roles |

---

## 6. Brand Hub Page (`/app/hub`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **Brand Kit Switcher Pills** | Click | Switches active kit between `Kettle & Co.` and `LedgerLeaf` | All roles |
| **PillTabs (Rules, Facts, Glossary, Claims)** | Click / Arrow keys | Displays corresponding brand governance knowledge section | All roles |
| **"+ New Guideline" Button** | Click | Opens modal to create a new rule with severity and banned terms | Brand manager & Admin |
| **"+ New Fact" Button** | Click | Opens modal to register an approved fact with permitted wording | Brand manager & Admin |
| **"+ New Term" Button** | Click | Quick-adds terminology constraints | Brand manager & Admin |
| **"+ New Claim Rule" Button** | Click | Quick-adds claims policy rules | Brand manager & Admin |
| **"Edit Rule" Button** | Click | Opens version change modal with change justification input | Brand manager & Admin only; shows visible note for others |
| **"Edit / Supersede Fact" Button** | Click | Opens modal to update permitted wording or mark as superseded | Brand manager & Admin |

---

## 7. Audit & AI Disclosure Page (`/app/audit`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **PillTabs (Audit log, AI disclosure ledger)** | Click / Arrow keys | Toggles between immutable append-only audit trail and AI model call ledger | All roles |
| **"Verify Trail Integrity" Button** | Click | Sequentially verifies SHA-256 cryptographic chain proof of audit log | All roles with Read Audit |
| **"CSV" Export Button** | Click | Downloads `pramaan_audit_trail.csv` containing full audit history | All roles with Read Audit |
| **"JSON" Export Button** | Click | Downloads `pramaan_audit_trail.json` containing structured records | All roles with Read Audit |
| **Actor Role Filter Pills** | Click | Filters audit log table by specific actor role | All roles |
| **"Toggle Mode" in Confidential Card** | Click | Toggles Confidential Mode state on backend and in browser session | Admin |

---

## 8. Brand Insights & Radar Page (`/app/insights`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **Brand Kit Filter PillSelect** | Select change | Recalculates rule ambiguity and repeated violations for selected kit | Reviewer/Manager/Admin only |
| **"Refresh" Button** | Click | Refetches latest analytics and simulated compliance radar metrics | Reviewer/Manager/Admin only |
| **"Edit in Brand Hub →" Link** | Click | Directly navigates to Brand Hub to update ambiguous guidelines | All roles |
| **Restricted Role Card** | Visible on load | Shows explanation when loaded in `Creator` role | Creator role |
| **"Switch to Reviewer Role" Button** | Click | Immediately switches role to `Reviewer` and refetches data | Creator role |

---

## 9. Responsive Layout & Viewport Verification (Two Layout Fixes)

Verified via Playwright across 14 distinct viewport widths (`360px`, `390px`, `414px`, `480px`, `520px`, `560px`, `600px`, `640px`, `700px`, `768px`, `900px`, `1000px`, `1023px`, and `1024px`) across all application routes in both `light` and `dark` themes:

1. **Strict 1024px Breakpoint**:
   - `≥1024px`: Hamburger is completely hidden (`display: none`, not focusable, absent from tab order). Sidebar is persistently 240px wide with logo, wordmark, nav links, and footer links.
   - `<1024px`: Sidebar is hidden. Hamburger is the first element at far left of the top bar with 44×44px touch target. Drawer header (logo mark + "Pramaan" + close button) sits directly above "Home".
2. **Zero Horizontal Overflow & Cut-Off Content**:
   - Removed artificial `overflow-x: hidden` / `overflow-x-clip` wrappers from `html`, `body`, and app shell.
   - Card text configured with `overflow-wrap: anywhere; word-break: break-word`.
   - All flex and grid child text containers enforce `min-w-0`.
   - Headers wrap gracefully (`flex-wrap: wrap`) so status badges like "Read-only" are never clipped.
   - Long metadata strings (ID, category, version, owner, banned terms) render as wrapping label/value pill rows. Below 768px (`md:`), secondary metadata (owner, banned terms, source) cleanly collapses into an accessible `<details>` accordion.
   - Only components with explicit `data-scrollable="true"` (such as `ScrollTabs`) may scroll horizontally, complete with left and right gradient edge fades.
   - Full automated Playwright tests verify `scrollWidth <= clientWidth + 1` (no hidden clipped text) and DOM bounds within `window.innerWidth + 1`.
   - Visual regression screenshots saved at 480px and 560px in `docs/screenshots/`.

