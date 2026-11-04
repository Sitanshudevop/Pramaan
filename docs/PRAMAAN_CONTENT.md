# PRAMAAN_CONTENT.md: source text for the Plan pages

> **How to use this file (for the coding agent).** This is the canonical text of the Pramaan Round 1 plan, converted to Markdown. Every "Plan" page of the website must be built from the matching section below, in a typed content module (for example `frontend/src/content/*.ts`). Keep the meaning, figures, caveats and citations exactly as written; you may split long tables into cards or accordions for readability, but do not drop rows, soften caveats or invent facts. Section-to-page mapping is defined in `PROMPT_ANTIGRAVITY.md`, Section 4 (Group B).

---

# Pramaan: Evidence-backed brand governance, before you publish

*Inkloom AI · CodeNexus India 2026 · Consolidated product plan for pre-publication content review*

> **Core promise.** Every finding has evidence. Every correction preserves the creator’s purpose. Every final decision remains human.

| Submission details | Value |
|---|---|
| **Problem statement** | Intelligent brand-governance platform for pre-publication content review |
| **Team name** | DOOM_CODER |
| **Team** | Solo participant |
| **Team lead** | Sitanshu Kumar · B.Tech Computer Science Engineering (2024–2028), Rungta International Skill University, Durg, Chhattisgarh |
| **Working name** | Pramaan is Hindi for “proof, evidence” |

## 1. Executive summary

**The problem.** Brand content is now produced by employees, agencies, freelancers and generative-AI tools. Guidelines exist, but they sit in documents that nobody opens mid-task. Outdated facts, unsupported promotional claims, inconsistent terminology, off-tone copy, off-brand visuals and accessibility defects therefore reach the public first and are caught later, if at all. Manual review is either a bottleneck or inconsistently applied.

**The solution.** Pramaan is a pre-publication brand-governance workspace. A brand team loads its approved guidelines, facts, terminology and assets once. Creators then submit text, supported documents or images with a short *purpose card* (audience, goal, key message, call to action and must-keep phrases). Pramaan runs deterministic checks and retrieval-grounded AI checks, and returns explainable findings that show the exact passage, the rule or source involved, the reason, the confidence and the method. It proposes purpose-preserving corrections and routes every decision through a role-based review and approval workflow.

### Three commitments

- **Proof for every finding.** Each displayed finding carries a rule or source ID. Where no approved source exists, Pramaan says “Unsupported” or “Needs human judgement”, and never “false” without evidence.

- **Fixes that keep the creator’s purpose.** Suggestions are re-checked against the violated rule and the purpose card. Nothing is silently rewritten or applied automatically; AI suggests and humans decide.

- **Guidelines that get clearer, and data that stays protected.** Override patterns and reviewer disagreement reveal vague rules, and a manager approves any new guideline version. Confidential Mode and a visible AI and data-disclosure ledger protect brand materials.

### Round 1 judging alignment

| **Judging criterion**                      | **Points** | **Where this document addresses it**                                       |
|--------------------------------------------|------------|----------------------------------------------------------------------------|
| **Understanding of the problem statement** | 25         | Sections 2–4: problem, evidence, users and research plan                   |
| **The proposed solution**                  | 25         | Sections 5–8: product, workflow, features and three committed improvements |
| **Technical plan**                         | 20         | Section 9: AI pipeline, stack, data sources and evaluation                 |
| **Originality of approach**                | 15         | Sections 8 and 11: differentiated design and positioning                   |
| **Feasibility and scope**                  | 15         | Sections 7 and 12–13: MVP boundaries, risks, timeline and roles            |

> **SUBMISSION STRATEGY** The plan prioritises a reliable, evidence-grounded text-first workflow, with document and visual checks added in stages. This is more credible than promising a fully autonomous enterprise platform within a short build window.

## 2. Problem definition and root causes

### 2.1 The problem

Brand trust is rarely lost in one big failure. It leaks through small, preventable moments: a claim that cannot be substantiated, a price that changed last quarter, a deprecated product name, a banned phrase, a low-contrast banner or an unapproved logo. In multi-author environments, the people who know the rules are not the people creating the content, and the review step that should connect them is slow, inconsistent and rarely explains itself.

### 2.2 Six vectors of pre-publication risk

| **Risk vector**                    | **Typical failure**                                                                                    | **Why it matters**                                               |
|------------------------------------|--------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| **Tone and voice drift**           | AI-generated or human copy is too formal, euphoric, generic or off-persona.                            | Weakens brand recognition and makes review subjective.           |
| **Outdated product information**   | Old pricing, retired features, expired roadmaps or superseded specifications.                          | Misleads customers and creates support and reputational risk.    |
| **Unsupported promotional claims** | “Fastest”, “100% failproof”, guaranteed outcomes, or health and environmental claims without evidence. | Creates consumer-protection, regulatory and legal exposure.      |
| **Visual brand degradation**       | Incorrect logo lock-up, spacing, colours, typography or unapproved imagery.                            | Makes campaigns inconsistent and damages brand presentation.     |
| **Accessibility defects**          | Low contrast, missing alt text, poor heading order or inaccessible text embedded in images.            | Excludes users and increases accessibility risk.                 |
| **Fragmented approvals**           | Decisions split across email, chat, documents and design tools.                                        | Lets unresolved issues bypass sign-off and weakens auditability. |

### 2.3 Root causes

- **Knowledge gap at the moment of creation.** Rules live in documents, not in the tools where content is written.

- **A review bottleneck that does not teach.** Scarce reviewers repeat the same corrections, apply rules inconsistently and often reply “not on brand” with no reason or source.

- **AI multiplies output faster than verification.** Content volume grows while review capacity stays flat, and generated drafts can blur facts without citing approved sources.

- **No living source of truth.** A static brand book is updated every 12 to 18 months, while prices, features, claims and positioning change far more often.

- **No feedback loop.** Repeated overrides and reviewer disagreements are rarely converted into clearer rules.

## 3. Evidence that the problem is real

The figures below come from published secondary sources, with their stated limitations. They are not primary research conducted by the team.

| **Evidence signal**                                  | **Reported finding**                                                                                                                                                                       | **Source and limitation**                                                                                                            |
|------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| **Guidelines are not operationalised**               | About 85% of organisations have brand guidelines, but only about 30% say they are widely known and used; about 77% create off-brand content at least a few times a year.                   | Marq/Lucidpress survey via MarketingProfs, 2021 \[1\]. Vendor-run, self-reported; an indicator, not a precise universal rate.        |
| **Consistency has perceived commercial value**       | Respondents estimated that consistent brand presentation could lift revenue by up to 33%.                                                                                                  | Lucidpress press release, Dec 2019 \[2\]. A perceived estimate, not causal proof or a guaranteed ROI.                                |
| **Advertising claims are an active issue in India**  | ASCI FY 2024–25: 9,599 complaints examined and 7,199 ads scrutinised; 98% of scrutinised ads needed modification and 56% were misleading.                                                  | ASCI Annual Complaints Report 2024–25 \[3\]. Skewed by category; not a typical brand-team error rate.                                |
| **Influencer content needs heavy correction**        | ASCI processed 1,173 influencer ads in Apr–Sep 2025; 98% required modification.                                                                                                            | ASCI Half-Yearly Report 2025–26 \[4\]. Shows the disclosure oversight need in this channel.                                          |
| **Accessibility failures are widespread**            | WebAIM Million 2026: detectable WCAG 2 failures on 95.9% of the top one million home pages; low contrast on 83.9%; missing alt text on 53.1%.                                              | WebAIM Million 2026 \[5\]. Covers website home pages, not campaign assets; used to motivate automated checks.                        |
| **Organisations answer for what their AI publishes** | Moffatt v. Air Canada held the airline responsible for incorrect policy information given by its chatbot.                                                                                  | 2024 BCCRT 149 \[6\]. One tribunal decision, not binding precedent.                                                                  |
| **Consumers care about consistency and privacy**     | 87% of surveyed consumers say brand consistency across touchpoints matters and 80% say inconsistency reduces trust. In India, 30% cite personal-data protection as a crucial trust factor. | Storyblok, 200 respondents \[12\]; PwC India Voice of the Consumer 2024 \[11\]. Small or vendor-published samples; directional only. |
| **Indian digital and privacy rules are evolving**    | 2026 amendments to the IT Rules require labelling of synthetically generated content; DPDP Rules 2025 were notified on 13 Nov 2025 with phased obligations.                                | Legal summaries \[7\]\[8\] are secondary. Confirm current applicability with qualified counsel before relying on them.               |

> **EVIDENCE LIMIT** Several figures are vendor surveys or secondary summaries. They measure perceptions or specific enforcement samples, not causation or the error rate of every organisation. The product hypotheses must be tested with the intended users (Section 4).

## 4. Target users and research plan

### 4.1 Organisational setting

**Beachhead.** Growing, content-intensive consumer-facing brands (D2C, SaaS and edtech, fintech, healthtech and services) of roughly 5 to 5,000 people, and the agencies that serve them. A typical team has 5 to 200 content contributors, one overstretched brand or marketing manager, and legal review by exception. Content includes social posts, ads, emails, landing pages, PDFs, decks and banners. Regulated categories such as health, finance and food are a natural second segment. These are hypotheses about the segment, to be validated rather than treated as measured market facts.

*Personas are illustrative archetypes, to be refined with interview data.*

| **User**                                      | **Goal and pain today**                                                                                    | **What Pramaan provides**                                                                                      |
|-----------------------------------------------|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| **Content creator or social media executive** | Publish quickly. Rules are hard to find, rejections are vague and unsupported claims are a constant worry. | Purpose card, inline checks, source-linked explanations and optional edits.                                    |
| **Agency designer or account manager**        | Keep several clients’ rules straight and avoid late rejections or unannounced guideline changes.           | Separate workspace and rules per client, assigned projects and an approval trail.                              |
| **Brand or marketing manager**                | Control quality without reading every draft; the same corrections keep recurring.                          | Risk-sorted review queue, approval gates and insights on repeated mistakes and unclear rules.                  |
| **Legal or compliance reviewer**              | Substantiate claims; problems are found late and cross-checked manually against product documents.         | Claim–evidence table, optional regulatory packs, escalation and an audit trail.                                |
| **Admin or brand-ops lead**                   | Keep the knowledge base current and confidential; manage versions and access.                              | Versioned knowledge base, sensitivity classes, role-based permissions, disclosure ledger and local-model mode. |

> **CORE JOB TO BE DONE** “When I am about to publish, I want to know quickly whether anything contradicts what we have approved, and why, so I can fix it myself or escalate with evidence.”

**Deployment surfaces.** (1) A governance web portal and asset hub for importing guidelines and running review pipelines. (2) API and webhook gateways so a CMS or social scheduler can call Pramaan before publishing. (3) A later in-flow browser extension for supported editors, which is a stretch goal.

### 4.2 Hypotheses to validate

| **ID** | **Hypothesis**                                                                                           | **Method**                  |
|--------|----------------------------------------------------------------------------------------------------------|-----------------------------|
| **H1** | Creators often do not know which guideline applies while they write.                                     | Interviews, survey          |
| **H2** | Rejections frequently lack an actionable reason or source, causing repeat rounds.                        | Observation, interviews     |
| **H3** | Reviewers repeat the same corrections across pieces.                                                     | Workflow observation, tally |
| **H4** | Teams drafting with AI have no practical way to verify claims against approved facts.                    | Interviews, survey          |
| **H5** | Confidentiality concerns limit sending brand material to cloud AI.                                       | Interviews, survey          |
| **H6** | Real guidelines contain vague wording (“friendly”, “where appropriate”) that reviewers read differently. | Guideline artefact analysis |

### 4.3 Primary research plan (planned, not claimed as completed)

| **Method**                      | **Proposed activity**                                                                                                                                    | **Expected output**                                      |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| **Semi-structured interviews**  | 8–10 interviews of about 30 minutes: 3–4 creators or freelancers, 2 agency staff, 2–3 brand or marketing managers and 1–2 reviewers or compliance staff. | Pain-point map, refined personas and feature priorities. |
| **Workflow observation**        | With consent, shadow one real draft-to-approval cycle; record hand-offs, elapsed time, revision rounds and correction types.                             | Baseline timeline and correction taxonomy.               |
| **Micro-survey**                | 15–25 responses in about five minutes on rework frequency, reviewers, tools, AI trust and data-sharing concerns.                                         | Directional evidence for H1–H5.                          |
| **Guideline artefact analysis** | Review 3–5 public brand-guideline documents for vague or conflicting wording. Analysis only; nothing is redistributed.                                   | Ambiguity taxonomy and test cases.                       |

**Decision rule.** If fewer than half of interviewees confirm H1 to H3, the beachhead is narrowed to the segment where they hold and features are re-prioritised. **Research ethics.** Informed consent, anonymised notes, no confidential materials collected without permission, and the right to withdraw.

## 5. Proposed solution and value proposition

For teams that publish through many hands and tools, Pramaan is the pre-publication brand check that **proves every finding**, **fixes without flattening intent** and **leaves humans in charge**. Guideline portals inform and style checkers correct text. Pramaan verifies content against approved facts across formats and shows where the guidelines themselves are unclear. It is not an autonomous publishing system.

### 5.1 Value delivered

- **Faster review.** Removes back-and-forth on routine style, fact and terminology issues (measured, not promised; see Section 14).

- **Fewer unsupported claims.** Every claim is checked against a versioned approved-facts register.

- **Teaches while it checks.** Explainable, non-destructive suggestions appear at the moment of creation.

- **Measurable governance.** Brand compliance becomes data: recurring errors and unclear rules.

### 5.2 Design principles

| **Principle**              | **In the product**                                                                                                                                                  |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Evidence first**         | A finding without a rule or source ID cannot be shown. Each finding lists the passage, clause or fact, reason, confidence and method (deterministic, AI or hybrid). |
| **Abstain when unsure**    | “Unsupported” is not “wrong”. Low-confidence or source-less judgements are labelled Needs human judgement.                                                          |
| **Human decides**          | Creators accept, edit or dismiss; reviewers override with a reason; managers approve. No automatic rewriting, approval or publishing.                               |
| **Confidential by design** | Data classes, minimal sharing with external AI, PII redaction, a local-model mode and a disclosure ledger.                                                          |

### 5.3 Product modules

| **Module**                          | **Core capability**                                                                                                                                                                | **User value**                                            |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| **Brand Knowledge Hub**             | Import guidelines, messaging, glossary, facts, claims policy, disclaimers, visual rules and assets. Each entry has a stable ID, owner, source, version, effective date and status. | A maintained, auditable source of truth.                  |
| **Content Intake and Purpose Card** | Paste text or submit supported DOCX, PDF or image files; capture goal, audience, key message, CTA and must-keep phrases.                                                           | Checks are judged in the context of the creator’s intent. |
| **Verification Engine**             | Deterministic rules, approved-source retrieval, tone analysis and supported visual and accessibility checks.                                                                       | Finds issues early and separates evidence from judgement. |
| **Explainable Finding Cards**       | Exact excerpt, category, severity, confidence, method, rule or source ID, rationale and suggested correction.                                                                      | Creators understand what to fix and why.                  |
| **Remediation Co-pilot**            | Suggests minimal edits, re-checks the rule and confirms that goal, key message, CTA and locked phrases survive.                                                                    | Corrections preserve author intent.                       |
| **Approval Workspace**              | Comments, assignments, version diffs, approve, request changes or reject, exceptions and an audit trail.                                                                           | Accountable human sign-off.                               |
| **Governance Insights**             | Aggregates recurring mistakes, overrides, reviewer disagreements and unclear rules.                                                                                                | Improves team behaviour and guideline quality.            |

### 5.4 What Pramaan detects

| **Category**           | **Examples and method**                                                                                               | **Source of truth and safeguard**                                                     |
|------------------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| **Tone and voice**     | Too formal or slangy copy, hyperbolic AI buzzwords. AI rubric with do and don’t examples, plus lexical features.      | Voice and tone guidelines. Advisory; reviewer can override.                           |
| **Terminology**        | Banned or deprecated terms, product-name casing, en-IN spelling. Deterministic phrase and lemma matching.             | Approved glossary; handles quotations and technical exceptions.                       |
| **Messaging**          | Contradicted positioning, missing mandatory line or disclaimer. Hybrid retrieval, AI and rules.                       | Messaging framework and mandatory-text rules.                                         |
| **Facts**              | Wrong or outdated price, spec, date or statistic. Entity extraction, retrieval and verifier.                          | Versioned approved-facts register. Model memory is never treated as company approval. |
| **Promotional claims** | Superlative, comparative, health, environmental and testimonial claims. Pattern detection plus substantiation lookup. | Claims policy and substantiation files; ambiguity is escalated.                       |
| **Visual consistency** | Palette deviation, logo clear-space, distortion, placement. OpenCV with CIEDE2000; multimodal AI as advisory only.    | Visual guidelines and asset library; low confidence goes to a human.                  |
| **Accessibility**      | Contrast ratio, alt text, heading order, link text, reading level. WCAG formulae; AI may assess alt-text quality.     | WCAG 2.2 AA as design reference; automated checks do not certify conformance.         |
| **AI and disclosure**  | Undeclared AI content, sponsored content without disclosure. Rules plus creator declaration.                          | Organisation disclosure policy and applicable legal review.                           |

### 5.5 Finding statuses and severity

| **Status**                | **Meaning**                                                                                       |
|---------------------------|---------------------------------------------------------------------------------------------------|
| **Supported**             | An approved source supports the claim within its stated scope and validity period.                |
| **Contradicted**          | The claim conflicts with an active approved fact; the approved value and validity date are shown. |
| **Unsupported**           | No approved evidence was found. This does not mean the claim is false.                            |
| **Needs human judgement** | Evidence is ambiguous, confidence is low or a subjective decision is required.                    |
| **Not checked**           | Input could not be reliably parsed, or the check is outside the supported scope.                  |

**Severity levels:** Blocker, Major, Minor and Info. Deterministic findings are reproducible. AI findings carry a confidence level and stay advisory unless a reviewer confirms them.

> **NON-NEGOTIABLE RULE** A pass means only that no issue was detected by the checks performed. It is not a guarantee of factual truth, legal compliance or complete brand consistency.

### 5.6 What a finding looks like (fictional brand)

> **DRAFT** “Meet our new Masala Chai: 100% pesticide-free and clinically proven to cure stress! Order today and taste the best tea in India.” *Purpose card: announce a new product; CTA: order on the website.*

> **MAJOR · UNSUPPORTED HEALTH CLAIM** Confidence high, method hybrid. “Clinically proven” and “cure” are health claims with no approved supporting fact. **Source:** Claims Policy §4.2 (v3); closest approved fact F-12, “certified organic leaves”.
>
> **Suggestion:** “Made with certified organic tea leaves for a comforting cup.” Purpose kept: new product and CTA. **Actions:** Accept, Edit, Dismiss with reason, Ask a reviewer.

> **MAJOR · SUPERLATIVE CLAIM** “The best tea in India” violates Claims Policy §3.1. **Suggestion:** “Order today and taste the new blend.”
>
> *The brand, policy numbers and fact F-12 are invented for illustration.*

## 6. End-to-end product workflow

| **\#** | **Who**                | **What happens**                                                                                                                                                                            | **Human control**                                                                                                         |
|--------|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **1**  | Admin or brand manager | Imports guidelines (PDF, DOCX, Markdown), approved facts with validity dates, glossary and assets. Pramaan proposes atomic rules and fact entries with stable IDs.                          | Nothing is active until an authorised manager reviews and publishes version 1.                                            |
| **2**  | Creator                | Submits text, a document or an image, completes the purpose card and declares any AI use.                                                                                                   | The creator controls the declared goal, audience, CTA and must-keep phrases.                                              |
| **3**  | System                 | Extracts text and metadata, runs deterministic checks, retrieves active approved sources, applies AI judgement with cited IDs, then verifies. Unsupported elements are marked, not ignored. | Low-confidence items are marked Needs human judgement. Model output cannot override access controls or invent source IDs. |
| **4**  | System and creator     | Finding cards show passage, category, severity, confidence, method, rule or source, reason and suggested fix. The creator accepts, edits, dismisses with a reason or requests an exception. | No automatic edits; every decision is logged.                                                                             |
| **5**  | System                 | Every edit creates a new version. Affected checks re-run and purpose-card constraints are verified.                                                                                         | Locked phrases are preserved, or the suggestion is downgraded.                                                            |
| **6**  | Reviewer               | Works a risk-sorted queue with anchored comments; confirms or overrides findings (reason required); approves routine items or requests changes.                                             | A reviewer can override the AI at any time.                                                                               |
| **7**  | Brand manager          | Gate rules escalate sensitive items, such as an overridden Blocker or a claim with no approved source.                                                                                      | Final approval is always human.                                                                                           |
| **8**  | System                 | Issues an approval certificate (versions, findings, decisions, AI and data disclosure) and updates insights.                                                                                | Managers, not AI, approve guideline changes.                                                                              |

**Content states:** Draft → Submitted → AI-reviewed → Changes requested ↔ Revised → In human review → Approved or Rejected → Exported. Every transition is time-stamped with the actor, version and reason.

**Tiered review:** low-risk edits (hyphenation, preferred synonyms) can be fast-tracked to a reviewer. Tone shifts, claims and visual anomalies always need explicit human sign-off, and even assets with no unresolved findings still receive a human approval click.

### 6.1 Roles and permissions (least privilege)

| **Action**                                       | **Creator** | **Reviewer**    | **Brand manager** | **Admin** | **Agency**        |
|--------------------------------------------------|-------------|-----------------|-------------------|-----------|-------------------|
| **Submit content and purpose card**              | Own         | —               | Yes               | —         | Assigned projects |
| **View findings and suggestions**                | Own         | Assigned        | Yes               | —         | Own               |
| **Accept, edit or dismiss suggestions**          | Own         | —               | —                 | —         | Own               |
| **Comment and request changes**                  | Reply       | Yes             | Yes               | —         | Reply             |
| **Override a finding (reason required)**         | —           | Yes             | Yes               | —         | —                 |
| **Approve or reject content**                    | —           | Non-gated items | Yes               | —         | —                 |
| **Propose guideline or fact changes**            | —           | Yes             | Yes               | Yes       | —                 |
| **Publish a guideline or fact version**          | —           | —               | Yes               | —         | —                 |
| **View team-level insights**                     | —           | Yes             | Yes               | Yes       | —                 |
| **View individual-level insights (with notice)** | —           | —               | Yes               | —         | —                 |
| **Manage users, roles, data and AI settings**    | —           | —               | —                 | Yes       | —                 |
| **Read audit log and disclosure ledger**         | Own         | Yes             | Yes               | Yes       | Own               |

## 7. Planned features and scope

| **Priority**                 | **Features**                                                                                                                                                                                                                                                                                                                         | **Acceptance evidence**                                                                                                              |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| **MVP (Round 2): must have** | Roles and workspace isolation; knowledge base with approved-facts register and glossary; text submission and purpose card; terminology and required-message checks; retrieval-grounded claim review; explainable findings; suggestion and re-check; comments, approval states, versions and audit log; AI and data-disclosure panel. | A judge configures a brand profile, submits content, sees source-linked findings, revises, routes for review and completes approval. |
| **MVP: should have**         | DOCX and PDF text extraction; PNG and JPG asset allow-list; basic contrast and alt-text checks; exportable review and approval report; initial recurring-issue dashboard.                                                                                                                                                            | Supported file types parse correctly; unsupported elements are marked Not checked.                                                   |
| **Finish (Round 3)**         | Guideline ambiguity radar and insights dashboard; Confidential Mode (local models); optional regulatory packs (ASCI, CCPA, WCAG 2.2); review API and webhooks; Slack, Teams and email notifications; PDF approval certificate; evaluation report and hardening.                                                                      | Three committed improvements demonstrated, with measured test results.                                                               |
| **Stretch**                  | Browser extension (Docs, Notion, WordPress, LinkedIn); PPTX review; Google Drive import; Figma or Canva plug-in; Hindi and Hinglish tone checks; agency guest portal; CMS publishing integrations.                                                                                                                                   | Attempted only after the core workflow is stable and event rules permit.                                                             |
| **Out of scope**             | Video or audio review, automatic publishing, image generation, legal advice or certification of compliance, and training models on customer data.                                                                                                                                                                                    | Explicitly excluded to protect feasibility and scope.                                                                                |

## 8. Three committed improvements

These are the signature differentiators carried through every round. The thresholds below are design targets and acceptance criteria, not achieved results; actual results, including any shortfalls, will be reported in Rounds 2 and 3.

| **Improvement**                                              | **What will be built**                                                                                                                                                                                                                                                                                                              | **Acceptance criteria**                                                                                                                                                                  |
|--------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Proof-or-abstain claim verification**                   | Each factual or promotional claim is extracted, linked to approved-fact entries and labelled Supported, Contradicted, Unsupported or Needs human. Contradicted claims show the approved value and validity date. Findings appear as structured cards with the exact excerpt, violated clause, approved source excerpt and severity. | 100% of shown findings carry a rule or source ID (schema-enforced). Claim-check precision ≥ 0.85 and recall ≥ 0.80 on the labelled set. The abstain path is demonstrated live.           |
| **2. Intent-preserving suggestions with a multi-modal pass** | A purpose card with locked phrases. Each suggestion is re-checked twice: the violated rule is re-run, and goal, key message and CTA are confirmed intact. Otherwise it is shown as Alternative, needs your judgement. Text, claim and visual checks run in one unified review pass.                                                 | ≥ 80% of suggestions resolve the issue on re-check. Zero deletions of locked phrases. Accept, edit and dismiss decisions are logged and the acceptance rate is reported from user tests. |
| **3. Guideline-clarity and recurring-mistake radar**         | A per-rule ambiguity score from override rate, reviewer disagreement, AI-ensemble disagreement, low retrieval margin and a vague-wording lint. It proposes clearer wording that a manager can approve as a new guideline version. Repeated mistakes are shown by rule, content type, team and agency (team-level by default).       | Dashboard populated from ≥ 100 simulated or real review events. Top-five rules to clarify, with evidence. At least one guideline revised end to end in the demo.                         |

## 9. Technical plan

The architecture is modular and auditable. The core text workflow is built first; document and image checks are added only for formats the team can parse and test reliably.

### 9.1 AI review pipeline

| **Stage**                      | **What happens**                                                                                                                                                                                                                                                              |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Ingest and normalise**       | Parse to structured blocks with character offsets, headings, images and alt text; OCR only where needed. Unsupported or unreadable elements are reported, never silently skipped. Submitted content is treated as untrusted data, never as instructions.                      |
| **Deterministic layer**        | Glossary and mandatory-text matching; number, date and price extraction; WCAG contrast from relative luminance; alt-text, heading-order and reading-level checks; CIEDE2000 palette distance; logo and asset allow-list checks. Reproducible, with no AI.                     |
| **Retrieval**                  | Hybrid keyword (BM25) and vector search over active, approved rules, facts and claims policy only, scoped by tenant, content type and validity date. Drafts, superseded versions and general web text are never retrievable. Every review records the guideline version used. |
| **AI judgement**               | A low-temperature model sees only the passage and the retrieved rules, and must return schema-valid JSON: category, severity, rule or source IDs, quoted span, reason and confidence.                                                                                         |
| **Verification**               | Code checks that cited IDs exist, the quoted span occurs in the content and severity matches the rule. High-severity findings get an independent second pass. Failures are dropped or downgraded to Needs human judgement.                                                    |
| **Suggest, re-check, persist** | Suggestions make the smallest necessary change and show a before and after diff; the original draft stays in version history. Findings are stored with model, provider, version, prompt hash and the data classes sent, feeding the disclosure ledger.                        |

**Prompt-injection defence.** Content is delimited and labelled as data; the model has no tools or network access; outputs are schema-validated; instructions found inside content are ignored and may themselves be flagged.

**Claim provenance ledger.** Each approved fact stores its source, owner, approval status, effective date, review or expiry date and permitted wording, so claims can be flagged when evidence is missing, stale or out of scope.

### 9.2 Technology stack

| **Layer**                | **Selected technology**                                                                                                                       | **Reason**                                                                  |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| **Frontend**             | React 18 and TypeScript (Vite), Tailwind CSS, accessible component primitives, Recharts and a diff view.                                      | Fast iteration, typed review states and an accessible review workspace.     |
| **API and workflow**     | Python 3.11, FastAPI, Pydantic v2; Redis and RQ for background jobs; LangChain or LlamaIndex for orchestration.                               | Python hosts the AI and vision libraries; strict schemas for every finding. |
| **Database**             | PostgreSQL 16 with pgvector and row-level security.                                                                                           | One store for relational data, versions and vectors; tenant isolation.      |
| **File storage**         | S3-compatible private object storage (MinIO locally), server-side encryption, no public file URLs.                                            | Keeps uploads and assets outside the relational database.                   |
| **Authentication**       | Short-lived JWT with refresh, Argon2id hashing, optional Google sign-in, server-side RBAC.                                                    | Least-privilege access and role-based review.                               |
| **Parsing and vision**   | PyMuPDF, python-docx, Pillow, OpenCV, scikit-image (CIEDE2000), Tesseract OCR.                                                                | Mature, permissively licensed extraction and image checks.                  |
| **NLP and privacy**      | spaCy phrase and lemma matching, textstat, Presidio for PII detection.                                                                        | Terminology, readability and redaction before any external call.            |
| **AI models**            | Hosted multimodal LLM behind a provider-agnostic adapter; local open-weight model through Ollama with local embeddings for Confidential Mode. | Quality and speed by default, a privacy option and no provider lock-in.     |
| **Quality and delivery** | pytest, Playwright, GitHub Actions CI, Docker Compose, free-tier hosting, structured logs and audit events.                                   | Regression tests on every pull request and a reproducible setup for judges. |

### 9.3 Data sources

| **Source**                                                                                                                | **Use**                                                          | **Licence and confidentiality**                                                          |
|---------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| **Synthetic brand kits for two fictional brands (guidelines, facts, glossary, assets), authored during the build window** | Demo, testing and the golden set                                 | The team’s own work; no third-party IP or confidential data.                             |
| **Public standards: WCAG 2.2, ASCI Code, CCPA 2022 misleading-ads guidelines**                                            | Optional packs; wording is the team’s own summary with citations | Referenced, not reproduced.                                                              |
| **Labelled evaluation set (about 120 items, including clean items for false positives)**                                  | Precision, recall and suggestion success                         | Own work; AI-drafted items are disclosed.                                                |
| **Customer uploads at runtime (guidelines, product truth tables, logos, legal clauses, campaign briefs)**                 | The real use case                                                | Customer-owned; classified Public, Internal or Confidential; never used to train models. |

### 9.4 Integrations

- **MVP:** file upload and paste, PDF approval certificate and email notification (SMTP).

- **Round 3:** review API and webhooks so a CMS (WordPress, Contentful, Strapi) or scheduler (Buffer, Hootsuite) can call Pramaan before publishing; Slack and Teams alerts and approval actions.

- **Later:** Google Docs and Drive import, Notion, Figma or Canva plug-in, browser extension, SSO and SCIM. Each integration follows only after permissions, API feasibility and data-processing terms are reviewed.

### 9.5 Evaluation and reliability

Targets are hypotheses for the prototype evaluation. Evaluation runs in CI on every pull request, and a failure log records each miss and fix. Results, including shortfalls, go in the Round 3 report.

| **Metric**                | **How it is measured**                                                                                                     | **Target or interpretation**                                           |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| **Evidence traceability** | Share of displayed findings linked to an active rule or source ID.                                                         | 100%, or an explicit abstention status.                                |
| **Check correctness**     | Precision, recall and F1 per category on the labelled set (two fictional brands, including clean items); confusion matrix. | Claim-check precision ≥ 0.85 and recall ≥ 0.80; report sample size.    |
| **Human agreement**       | Two annotators label 30 items; Cohen’s κ.                                                                                  | Makes the ground truth credible.                                       |
| **Suggestion quality**    | Share of suggestions that resolve the flagged issue on re-check while preserving purpose.                                  | ≥ 80%, with zero deletion of locked phrases.                           |
| **Workflow completion**   | Creator → review → revision → approval in test scenarios.                                                                  | All happy paths complete with no manual database intervention.         |
| **Human control**         | Permissions, overrides, escalation and the absence of auto-publish.                                                        | High-severity and uncertain claims always need a human decision.       |
| **Security and privacy**  | Tenant isolation, roles, file access, deletion and log tests.                                                              | No unauthorised cross-role or cross-workspace access in defined tests. |

## 10. Responsible design: privacy, security and human oversight

| **Area**                        | **Design commitment**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Human oversight**             | AI never publishes, approves, rejects or finally edits anything. Deterministic checks flag rule violations; AI findings are advisory. Blockers, legal, regulated and unsupported sensitive claims need human sign-off. Every override needs a reason and is logged. Creators can contest a finding or request an exception, escalating to a senior brand lead.                                                                                                                                                                                                                                    |
| **Privacy and confidentiality** | Private-by-default workspaces; data classes (Public, Internal, Confidential); tenant isolation with row-level security; TLS in transit and encryption at rest. PII is redacted before any external call and only minimal passages leave the system. Confidential Mode uses a local model and embeddings with no external calls. Provider terms and retention are reviewed so customer content is not used for training; zero-data-retention is claimed only where verified contractually. Retention, export and deletion controls support DPDP principles (a design intent, not a certification). |
| **Security**                    | Server-side authorisation on every endpoint; short-lived tokens; Argon2id; upload type and size validation with sandboxed parsing; rate limits; no server-side URL fetching in the MVP; append-only audit log; secrets kept outside the repository; dependency scanning; an OWASP ASVS-aligned checklist; agency accounts sandboxed from other business units.                                                                                                                                                                                                                                    |
| **Transparency**                | Every finding shows passage, reason, source, confidence and method. AI suggestions are labelled. A visible disclosure ledger records which provider and model processed which data class and when. A notice states that Pramaan supports, and does not replace, legal review.                                                                                                                                                                                                                                                                                                                     |
| **Fairness and inclusion**      | Tone and readability rules are calibrated for Indian English and do not penalise regional usage. Hinglish is routed to human review until tested. False positives are monitored and no demographic or sensitive traits are scored. Insights are team-level by default; individual views are manager-only, with notice, for coaching rather than surveillance.                                                                                                                                                                                                                                     |
| **Accessibility**               | The product interface is designed toward WCAG 2.2 AA with keyboard navigation, visible focus, semantic structure and contrast, combining automated and manual testing.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **IP and licensing**            | Libraries are used under their licences and listed. Public standards are referenced, not reproduced. Customer assets remain customer property and the demo brand kits are original.                                                                                                                                                                                                                                                                                                                                                                                                               |

**Reference frameworks (no certification claimed):** NIST AI Risk Management Framework for identifying and managing AI risk, and W3C WCAG 2.2 for the product interface and accessibility checks.

### 10.1 Key implementation threats

| **Threat**                                     | **Mitigation**                                                                                                                                                            |
|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Prompt injection in uploads**                | Content is untrusted data and can never override policy or access controls; the model has no tools or network; outputs are schema-validated; adversarial tests run in CI. |
| **Cross-workspace leakage**                    | Tenant scoping and row-level security on every query; authorisation boundaries are tested.                                                                                |
| **Stale policy or facts**                      | Version and effective-date checks; the exact source version used is shown for every review.                                                                               |
| **Hallucinated or misattributed findings**     | Schema-enforced source IDs; verification of IDs and quoted spans; second pass on high severity; abstain or downgrade.                                                     |
| **Confidential data reaching an external API** | Data classes, a redaction gateway, minimal snippets, local Confidential Mode and the disclosure ledger.                                                                   |
| **Unsafe uploads**                             | Validate MIME type and size, scan where available, isolate parsing and reject unsupported formats.                                                                        |
| **Audit tampering**                            | Append-only audit log, privileged actions logged and database backups.                                                                                                    |

## 11. Originality and competitive positioning

Pramaan does not claim to be the first brand checker. Its originality is the **combination** of evidence-linked claim verification, purpose-preserving corrections, visual and accessibility checks in one pass, and a feedback loop that improves the clarity of the guidelines themselves.

| **Existing approach**                                                    | **What it does well**                                       | **Gap Pramaan addresses**                                                                                                 |
|--------------------------------------------------------------------------|-------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Brand-management and DAM platforms (e.g. Frontify, Bynder)**           | Central guidelines and asset access.                        | They inform or control access but do not review each new draft against approved facts, rules and claims.                  |
| **Template tools (e.g. Marq)**                                           | Locked templates keep layouts on brand.                     | They miss wrong claims or off-tone copy written inside the template.                                                      |
| **AI style and compliance checkers (e.g. Acrolinx, Writer-style tools)** | Enterprise language and terminology checks, mostly on text. | Pramaan adds approved-fact provenance, visual and accessibility checks, purpose-preserving fixes and guideline analytics. |
| **General-purpose AI assistants**                                        | Flexible, instant feedback.                                 | They lack approved sources, role-based approvals, version history and a disclosure ledger.                                |

*Based on public product descriptions; capabilities change and these products have not been benchmarked by the team.*

### What is genuinely new

- **Claim provenance ledger.** Proof-or-abstain verification against a versioned approved-facts register.

- **Purpose-preserving correction.** A purpose card with a dual re-check and minimal-edit diffs, so suggestions keep the creator’s goal; the original draft stays in version history.

- **Guideline ambiguity radar.** Measures which rules are unclear, not just which content is wrong, and closes the loop into versioned guidelines that only a manager can publish.

- **Disclosure ledger and Confidential Mode** as first-class features rather than afterthoughts.

## 12. Feasibility, scope control and risks

**Why this is feasible.** The team assembles proven components (parsers, pgvector, hosted and local LLMs, OpenCV) rather than inventing them, matches the stack to skills it already has, and builds one narrow, text-first workflow end to end before adding multimodal analysis, integrations or advanced analytics.

> **DEFINITION OF DONE: ROUND 2** Create a workspace → import guidelines and facts → submit a text draft and an image → receive evidence-linked findings → accept a suggestion → reviewer comments → manager approves → certificate and audit trail, on a deployed link with a public repository.

**Cut order if time runs short:** stretch items → regulatory packs → notifications → extra insight views → deep visual matching. Source-grounded checks and the approval workflow are protected.

### 12.1 Risk register

| **Risk**                                  | **Mitigation**                                                                                                                                   |
|-------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| **AI invents or misattributes a finding** | Schema-enforced source IDs; verifier checks IDs and quoted spans; second pass on high severity; abstain or downgrade.                            |
| **Missed violations (false negatives)**   | Deterministic checks wherever a rule is possible; labelled test set with recall targets; limitations disclosed; reviewers remain the safety net. |
| **Automation bias**                       | Confidence and method shown; a Needs human judgement bucket; mandatory human approval; no auto-apply.                                            |
| **API cost, latency or outage**           | Caching, a small first-pass model, batching, asynchronous jobs and a provider-agnostic adapter with local fallback.                              |
| **Scope creep**                           | MoSCoW list (Section 7); weekly scope review; stretch items need sign-off.                                                                       |
| **Biased flags on language variety**      | en-IN calibrated rules; Hinglish routed to human review; fairness cases in the golden set.                                                       |

### 12.2 Known limits (stated openly)

- Tone and visual consistency are partly subjective; automated output can produce false positives or miss subtle issues.

- A source-linked check confirms a match to a stored approved record; it cannot guarantee that the record itself is true or legally sufficient.

- OCR, PDF extraction and image analysis vary with file quality and layout; unsupported content is marked Not checked.

- Automation cannot establish full WCAG conformance; manual review remains necessary.

- Enterprise deployment needs security, legal, privacy, procurement and integration reviews beyond a hackathon MVP.

## 13. Development plan and role allocation

**Build-window discipline.** The organiser’s rules permit research, interviews, wireframes and planning before development, but restrict implementation to the official build window. Before the window, the team does research, workflow mapping, wireframes, architecture and role allocation only, with no product code. Exact dates must be confirmed against the organiser’s latest rules.

Milestones are sequenced so they can be scaled to the official window. **M1 to M3 map to Round 2 (The Build); M4 to M6 map to Round 3 (The Finish).**

| **Workstream**            | **M1**                   | **M2**             | **M3**                        | **M4**               | **M5**                               | **M6**             |
|---------------------------|--------------------------|--------------------|-------------------------------|----------------------|--------------------------------------|--------------------|
| **AI and vision**         | Test set, prompts        | Pipeline v1 (text) | Image and visual checks       | Improvements 1 and 2 | Confidential Mode, evaluation report | Final tuning       |
| **Backend and security**  | Auth, RBAC, schema       | Jobs, findings API | Workflow, versions, audit log | Insights APIs        | Security review, disclosure ledger   | Deploy, docs       |
| **Frontend and UX**       | Design system, app shell | Finding cards      | Review and approval UI        | Insights dashboard   | WCAG audit of the UI                 | Polish, demo flow  |
| **Research, QA and docs** | Brand kit, golden set    | Test plan          | User test 1 (≥ 5 users)       | User test 2          | Reliability tests                    | Report, demo video |

**Working practices.** Public repository from day one of the build window; small commits and pull requests; a weekly demo against the Definition of Done; and a disclosure file listing libraries, licences, external services and AI-generated components. One person works through the workstreams in sequence, not in parallel.

### 13.1 Team allocation

*One participant owns every workstream.*

| Role | Team member | Responsibilities |
|---|---|---|
| **Solo participant (all roles)** | Sitanshu Kumar | Architecture, AI and vision pipeline, backend and security, frontend and UX, research and QA, documentation and demo video. |

*Delivery is sequenced by one person, so the cut order in Section 12 is applied strictly. A personal contribution log and a genuine commit history are kept.*

## 14. Expected impact and success metrics

Impact will be measured, not assumed. About 20 drafts will be reviewed manually and with Pramaan by test participants. **Targets are hypotheses, not results; the size of any benefit is unknown until it is measured with real users and representative content.**

| **Metric**                             | **How it is measured**                                                  | **Target**                                                                |
|----------------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------|
| **First-pass approval rate**           | Drafts approved without a change round.                                 | Above the manual baseline.                                                |
| **Review cycles and time to approval** | Audit-log timestamps, manual versus assisted review on the same drafts. | Fewer cycles; aim for ≥ 30% shorter time (design target, to be measured). |
| **Reviewer minutes per item**          | Timed user tests.                                                       | Below the manual baseline.                                                |
| **Repeat-violation rate**              | Same rule violated again by the same team.                              | Falling over time.                                                        |
| **Suggestion acceptance and trust**    | Accept, edit and dismiss log; short questionnaire.                      | Reported with dismissal reasons.                                          |
| **Guideline clarity**                  | Ambiguous rules clarified through the override and disagreement loop.   | At least one end-to-end revision in the demo.                             |

- **Organisational impact:** earlier detection of policy mismatches, an audit-ready approval trail, claim traceability, visibility into which content was AI-assisted, more accessible content and faster agency onboarding.

- **Societal impact:** fewer consumers exposed to unsupported claims and better access for people with disabilities.

- **Roadmap:** Hindi and Hinglish support, PPTX and video captions, Figma and Docs plug-ins, a browser extension, SSO and SCIM, on-premise deployment and a public brand-compliance benchmark.

## 15. Disclosures, integrity statement and submission checklist

- **Build window.** Implementation starts only inside the official build window, and the commit history will show this.

- **AI assistance.** This planning document was prepared with AI assistance for research synthesis and drafting. The team is responsible for verifying all facts, sources and final content, and significant AI-generated build components will be disclosed in the repository.

- **Reused material.** No templates or boilerplate are claimed. Open-source libraries are used under their licences and listed.

- **External services.** A hosted LLM API and free-tier hosting, disclosed in the README and in the product’s disclosure panel.

- **Truthfulness.** Personas are archetypes, all success figures are targets, the example in Section 5.6 uses a fictional brand, and no completed primary research, pilots, partnerships or product tests are claimed.

## 16. References

**\[1\]** MarketingProfs, “Are businesses creating and using brand guidelines?” (Marq/Lucidpress survey data), 2021. [<u>https://www.marketingprofs.com/charts/2021/45661/are-businesses-creating-and-using-brand-guidelines</u>](https://www.marketingprofs.com/charts/2021/45661/are-businesses-creating-and-using-brand-guidelines)

**\[2\]** Lucidpress, “Study finds companies with consistent branding can see up to 33% increase in revenue”, PR Newswire, 2 Dec 2019. [<u>https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html</u>](https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html)

**\[3\]** Advertising Standards Council of India (ASCI), Annual Complaints Report 2024–25, press release, 28 May 2025. [<u>https://ascionline.in/wp-content/uploads/2025/05/ASCI-Press-Release-Annual-Complaints-Report-2024-25-1.pdf</u>](https://ascionline.in/wp-content/uploads/2025/05/ASCI-Press-Release-Annual-Complaints-Report-2024-25-1.pdf)

**\[4\]** ASCI, Half-Yearly Complaints Report, April–September 2025. [<u>https://ascionline.in/wp-content/uploads/2025/11/ASCI-Half-Yearly-Complaints-Report-2025-26.pdf</u>](https://ascionline.in/wp-content/uploads/2025/11/ASCI-Half-Yearly-Complaints-Report-2025-26.pdf)

**\[5\]** WebAIM, The WebAIM Million (2026 report; analysis of Feb 2026). [<u>https://webaim.org/projects/million/</u>](https://webaim.org/projects/million/)

**\[6\]** Moffatt v. Air Canada, 2024 BCCRT 149 (Civil Resolution Tribunal of British Columbia, 14 Feb 2024). [<u>https://canlii.ca/t/k2spq</u>](https://canlii.ca/t/k2spq)

**\[7\]** MeitY, Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026 (notified 10 Feb 2026). Legal summary: [<u>https://www.mondaq.com/india/it-and-internet/1773560/government-notifies-information-technology-amendment-rules-2026</u>](https://www.mondaq.com/india/it-and-internet/1773560/government-notifies-information-technology-amendment-rules-2026)

**\[8\]** MeitY, Digital Personal Data Protection Rules, 2025 (notified 13 Nov 2025). Law-firm summaries only; verify current commencement and applicability before relying on legal conclusions.

**\[9\]** W3C, Web Content Accessibility Guidelines (WCAG) 2.2. [<u>https://www.w3.org/TR/WCAG22/</u>](https://www.w3.org/TR/WCAG22/)

**\[10\]** Product-category references for positioning: Acrolinx (acrolinx.com), Marq (marq.com) and the Rocketium creative-compliance overview (rocketium.ai).

**\[11\]** PwC India, Voice of the Consumer Survey 2024: India Perspective (1,000 Indian consumers within a 20,000+ consumer, 31-country study). Supports privacy and human-control requirements only. [<u>https://www.pwc.in/voiceofconsumer2024</u>](https://www.pwc.in/voiceofconsumer2024)

**\[12\]** Storyblok, consumer survey of 200 people in the US and Europe, 25 Mar 2026. Vendor-published and small; directional only.

**\[13\]** NIST, AI Risk Management Framework and AI RMF Playbook (voluntary references; no certification claimed).

**\[14\]** Inkloom AI, supplied Round 1 problem statement and event instructions. The organiser’s original document is the controlling source for required sections, judging weights, build-window rules and submission integrity.
