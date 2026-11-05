# Pramaan Interaction Inventory & Verification Checklist

This document catalogs every interactive element across Pramaan, its trigger, and its verified expected result.

---

## 1. Global Shell & Navigation

| Component | Element / Selector | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|---|
| **Logo** | `header a[href="/"]` or sidebar logo | Click | Navigates to `/` (Home), updates URL and view | None |
| **Sidebar Navigation** | NavLink `Home` (`/`) | Click | Navigates to `/`, sets active solid pill, loads Home view | None |
| **Sidebar Navigation** | NavLink `New Review` (`/app/new`) | Click | Navigates to `/app/new`, loads New Review form | None |
| **Sidebar Navigation** | NavLink `Review Queue` (`/app/queue`) | Click | Navigates to `/app/queue`, loads review table | None |
| **Sidebar Navigation** | NavLink `Brand Hub` (`/app/hub`) | Click | Navigates to `/app/hub`, loads Brand Guidelines & Rules | None |
| **Sidebar Navigation** | NavLink `Audit & Disclosure` (`/app/audit`) | Click | Navigates to `/app/audit`, loads Audit Ledger | None |
| **Sidebar Navigation** | NavLink `Brand Insights` (`/app/insights`) | Click | Navigates to `/app/insights`, loads analytics radar | Requires Reviewer/Manager/Admin |
| **TopBar Drawer Toggle** | Button `[aria-label="Toggle navigation drawer"]` | Click | Opens/closes mobile drawer on `< 1024px` | Mobile/tablet only |
| **Confidential Toggle** | TopBar button (Confidential Chip) | Click | Toggles Confidential Mode between ON and OFF; sends `X-Confidential-Mode` | None |
| **Demo Role Switcher** | TopBar `select[aria-label="Demo Role Switcher"]` | Change | Switches active role (`Creator`, `Reviewer`, `Brand manager`, `Admin`); updates permissions | None |
| **Theme Toggle** | TopBar button `[aria-label^="Cycle theme"]` | Click | Cycles theme between `light`, `dark`, and `system`; persists in localStorage | None |

---

## 2. Home Page (`/`)

| Element | Trigger | Expected Result |
|---|---|---|
| **"Try a sample review" Button** | Click | Navigates directly to `/app/new` |
| **"Open Brand Hub" Button** | Click | Navigates directly to `/app/hub` |
| **Hero 3D Floating Cards** | Hover / Tab | Purely decorative (`pointer-events: none`, `aria-hidden="true"`); never obstructs clicks |

---

## 3. New Content Review Page (`/app/new`)

| Element | Trigger | Expected Result |
|---|---|---|
| **Sample 1 ("Kettle & Co.") Button** | Click | Populates Brand Kit dropdown, Purpose Card, and sample promotional text |
| **Sample 2 ("LedgerLeaf") Button** | Click | Populates Brand Kit dropdown, Purpose Card, and sample financial text |
| **Brand Kit PillSelect** | Select change | Updates selected brand kit and loads kit-specific rules |
| **Content Type PillSelect** | Select change | Updates content format metadata (`Promotional Email`, `Social Post`, etc.) |
| **Locked Phrases Tag Input** | Enter key / button | Adds custom locked phrase chip into the Purpose Card list |
| **Locked Phrase Remove Chip** | Click (X) | Removes selected phrase from the locked list |
| **AI Assistance Checkbox** | Toggle | Sets `ai_declared: true/false`, recorded in disclosure ledger |
| **"Run Review" Primary Button** | Click / Submit | Submits review to backend; navigates to `/app/review/:id` on completion |

---

## 4. Review & Findings Page (`/app/review/:id`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **"Certificate (HTML/PDF)" Link** | Click | Opens tamper-evident certificate in new tab | All roles |
| **"Approve Review" Button** | Click | Marks review status as `Approved`; updates workflow badge | Brand manager & Admin only; shows visible disabled tooltip for Creator/Reviewer |
| **PillTabs (Findings, Suggestions, History, Sources)** | Click / Arrow keys | Switches active view panel; focuses active tab | All roles |
| **"Accept Suggestion" Button** | Click | Opens confirmation modal; applies unified diff fix | Creator, Reviewer, Manager |
| **"Edit" Button** | Click | Opens modal with editable replacement text area | Creator, Reviewer, Manager |
| **"Dismiss" Button** | Click | Opens modal requiring justification reason | Creator, Reviewer, Manager |
| **"Override Finding" Button** | Click | Opens override modal requiring justification reason | Reviewer & Manager only; visible disabled state for Creator |
| **Action Modal Confirm Button** | Click | Executes mutation and invalidates cache; disabled with reason warning if empty | Reason mandatory for dismiss/override |
| **Comments Form Input & Submit** | Type + Submit | Adds review comment to thread with actor role & timestamp | All roles |

---

## 5. Review Queue Page (`/app/queue`)

| Element | Trigger | Expected Result |
|---|---|---|
| **"New Review" Primary Button** | Click | Navigates to `/app/new` |
| **SearchPill** | Type query | Dynamically filters queue table by ID, kit, or role |
| **SearchPill Clear (X) Button** | Click | Clears search text and restores all table rows |
| **Status Filter PillSelect** | Select change | Filters queue by status (`Submitted`, `AI-reviewed`, `Approved`) |
| **Severity Filter PillSelect** | Select change | Filters queue by blockers or clean status |
| **Table Row / Mobile Card** | Click / Enter | Navigates directly to `/app/review/:id` |

---

## 6. Brand Hub Page (`/app/hub`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **Brand Kit Switcher Pills** | Click | Switches active kit between `Kettle & Co.` and `LedgerLeaf` | All roles |
| **PillTabs (Rules, Facts, Glossary, Claims)** | Click / Arrow keys | Displays corresponding brand governance knowledge section | All roles |
| **"Edit Rule" Button** | Click | Opens version change modal with change justification input | Brand manager & Admin only; shows visible note for others |
| **"Publish New Version" Modal Button** | Click | Publishes new rule version; archives old version with reason | Brand manager & Admin only; disabled if reason is empty |

---

## 7. Audit & AI Disclosure Page (`/app/audit`)

| Element | Trigger | Expected Result |
|---|---|---|
| **PillTabs (Audit log, AI disclosure ledger)** | Click / Arrow keys | Toggles between immutable append-only audit trail and AI model call ledger |
| **"Toggle Mode" in Confidential Card** | Click | Toggles Confidential Mode state |

---

## 8. Brand Insights & Radar Page (`/app/insights`)

| Element | Trigger | Expected Result | Role-Gated Behavior |
|---|---|---|---|
| **Brand Kit Filter PillSelect** | Select change | Recalculates rule ambiguity and repeated violations for selected kit | Reviewer/Manager/Admin only |
| **Restricted Role Card** | Visible on load | Shows explanation when loaded in `Creator` role | Creator role |
| **"Switch to Reviewer Role" Button** | Click | Immediately switches role to `Reviewer` and refetches data | Creator role |
