/**
 * Canonical plan content extracted faithfully from docs/PRAMAAN_CONTENT.md.
 * Figures, caveats, and citations are preserved verbatim per Section 4 & 13.
 */

export const PLAN_DATA = {
  submissionDetails: {
    problemStatement: 'Intelligent brand-governance platform for pre-publication content review',
    teamName: 'DOOM_CODER',
    teamSize: 'Solo participant',
    teamLead: 'Sitanshu Kumar · B.Tech Computer Science Engineering (2024–2028), Rungta International Skill University, Durg, Chhattisgarh',
    workingName: 'Pramaan is Hindi for “proof, evidence”',
  },

  executiveSummary: {
    problem:
      'Brand content is now produced by employees, agencies, freelancers and generative-AI tools. Guidelines exist, but they sit in documents that nobody opens mid-task. Outdated facts, unsupported promotional claims, inconsistent terminology, off-tone copy, off-brand visuals and accessibility defects therefore reach the public first and are caught later, if at all. Manual review is either a bottleneck or inconsistently applied.',
    solution:
      'Pramaan is a pre-publication brand-governance workspace. A brand team loads its approved guidelines, facts, terminology and assets once. Creators then submit text, supported documents or images with a short purpose card (audience, goal, key message, call to action and must-keep phrases). Pramaan runs deterministic checks and retrieval-grounded AI checks, and returns explainable findings that show the exact passage, the rule or source involved, the reason, the confidence and the method. It proposes purpose-preserving corrections and routes every decision through a role-based review and approval workflow.',
    commitments: [
      {
        title: 'Proof for every finding',
        desc: 'Each displayed finding carries a rule or source ID. Where no approved source exists, Pramaan says “Unsupported” or “Needs human judgement”, and never “false” without evidence.',
      },
      {
        title: 'Fixes that keep the creator’s purpose',
        desc: 'Suggestions are re-checked against the violated rule and the purpose card. Nothing is silently rewritten or applied automatically; AI suggests and humans decide.',
      },
      {
        title: 'Guidelines that get clearer, and data that stays protected',
        desc: 'Override patterns and reviewer disagreement reveal vague rules, and a manager approves any new guideline version. Confidential Mode and a visible AI and data-disclosure ledger protect brand materials.',
      },
    ],
    judgingAlignment: [
      { criterion: 'Understanding of the problem statement', points: 25, address: 'Sections 2–4: problem, evidence, users and research plan' },
      { criterion: 'The proposed solution', points: 25, address: 'Sections 5–8: product, workflow, features and three committed improvements' },
      { criterion: 'Technical plan', points: 20, address: 'Section 9: AI pipeline, stack, data sources and evaluation' },
      { criterion: 'Originality of approach', points: 15, address: 'Sections 8 and 11: differentiated design and positioning' },
      { criterion: 'Feasibility and scope', points: 15, address: 'Sections 7 and 12–13: MVP boundaries, risks, timeline and roles' },
    ],
  },

  problem: {
    summary:
      'Brand trust is rarely lost in one big failure. It leaks through small, preventable moments: a claim that cannot be substantiated, a price that changed last quarter, a deprecated product name, a banned phrase, a low-contrast banner or an unapproved logo. In multi-author environments, the people who know the rules are not the people creating the content, and the review step that should connect them is slow, inconsistent and rarely explains itself.',
    vectors: [
      {
        vector: 'Tone and voice drift',
        failure: 'AI-generated or human copy is too formal, euphoric, generic or off-persona.',
        impact: 'Weakens brand recognition and makes review subjective.',
      },
      {
        vector: 'Outdated product information',
        failure: 'Old pricing, retired features, expired roadmaps or superseded specifications.',
        impact: 'Misleads customers and creates support and reputational risk.',
      },
      {
        vector: 'Unsupported promotional claims',
        failure: '“Fastest”, “100% failproof”, guaranteed outcomes, or health and environmental claims without evidence.',
        impact: 'Creates consumer-protection, regulatory and legal exposure.',
      },
      {
        vector: 'Visual brand degradation',
        failure: 'Incorrect logo lock-up, spacing, colours, typography or unapproved imagery.',
        impact: 'Makes campaigns inconsistent and damages brand presentation.',
      },
      {
        vector: 'Accessibility defects',
        failure: 'Low contrast, missing alt text, poor heading order or inaccessible text embedded in images.',
        impact: 'Excludes users and increases accessibility risk.',
      },
      {
        vector: 'Fragmented approvals',
        failure: 'Decisions split across email, chat, documents and design tools.',
        impact: 'Lets unresolved issues bypass sign-off and weakens auditability.',
      },
    ],
    rootCauses: [
      'Knowledge gap at the moment of creation. Rules live in documents, not in the tools where content is written.',
      'A review bottleneck that does not teach. Scarce reviewers repeat the same corrections, apply rules inconsistently and often reply “not on brand” with no reason or source.',
      'AI multiplies output faster than verification. Content volume grows while review capacity stays flat, and generated drafts can blur facts without citing approved sources.',
      'No living source of truth. A static brand book is updated every 12 to 18 months, while prices, features, claims and positioning change far more often.',
      'No feedback loop. Repeated overrides and reviewer disagreements are rarely converted into clearer rules.',
    ],
  },

  evidence: {
    callout:
      'Several figures are vendor surveys or secondary summaries. They measure perceptions or specific enforcement samples, not causation or the error rate of every organisation. The product hypotheses must be tested with the intended users (Section 4).',
    signals: [
      {
        signal: 'Guidelines are not operationalised',
        finding: 'About 85% of organisations have brand guidelines, but only about 30% say they are widely known and used; about 77% create off-brand content at least a few times a year.',
        source: 'Marq/Lucidpress survey via MarketingProfs, 2021 [1]. Vendor-run, self-reported; an indicator, not a precise universal rate.',
      },
      {
        signal: 'Consistency has perceived commercial value',
        finding: 'Respondents estimated that consistent brand presentation could lift revenue by up to 33%.',
        source: 'Lucidpress press release, Dec 2019 [2]. A perceived estimate, not causal proof or a guaranteed ROI.',
      },
      {
        signal: 'Advertising claims are an active issue in India',
        finding: 'ASCI FY 2024–25: 9,599 complaints examined and 7,199 ads scrutinised; 98% of scrutinised ads needed modification and 56% were misleading.',
        source: 'ASCI Annual Complaints Report 2024–25 [3]. Skewed by category; not a typical brand-team error rate.',
      },
      {
        signal: 'Influencer content needs heavy correction',
        finding: 'ASCI processed 1,173 influencer ads in Apr–Sep 2025; 98% required modification.',
        source: 'ASCI Half-Yearly Report 2025–26 [4]. Shows the disclosure oversight need in this channel.',
      },
      {
        signal: 'Accessibility failures are widespread',
        finding: 'WebAIM Million 2026: detectable WCAG 2 failures on 95.9% of the top one million home pages; low contrast on 83.9%; missing alt text on 53.1%.',
        source: 'WebAIM Million 2026 [5]. Covers website home pages, not campaign assets; used to motivate automated checks.',
      },
      {
        signal: 'Organisations answer for what their AI publishes',
        finding: 'Moffatt v. Air Canada held the airline responsible for incorrect policy information given by its chatbot.',
        source: '2024 BCCRT 149 [6]. One tribunal decision, not binding precedent.',
      },
      {
        signal: 'Consumers care about consistency and privacy',
        finding: '87% of surveyed consumers say brand consistency across touchpoints matters and 80% say inconsistency reduces trust. In India, 30% cite personal-data protection as a crucial trust factor.',
        source: 'Storyblok, 200 respondents [12]; PwC India Voice of the Consumer 2024 [11]. Small or vendor-published samples; directional only.',
      },
      {
        signal: 'Indian digital and privacy rules are evolving',
        finding: '2026 amendments to the IT Rules require labelling of synthetically generated content; DPDP Rules 2025 were notified on 13 Nov 2025 with phased obligations.',
        source: 'Legal summaries [7][8] are secondary. Confirm current applicability with qualified counsel before relying on them.',
      },
    ],
  },

  users: {
    beachhead:
      'Growing, content-intensive consumer-facing brands (D2C, SaaS and edtech, fintech, healthtech and services) of roughly 5 to 5,000 people, and the agencies that serve them. A typical team has 5 to 200 content contributors, one overstretched brand or marketing manager, and legal review by exception. Regulated categories such as health, finance and food are a natural second segment.',
    personas: [
      {
        role: 'Content creator or social media executive',
        pain: 'Publish quickly. Rules are hard to find, rejections are vague and unsupported claims are a constant worry.',
        provides: 'Purpose card, inline checks, source-linked explanations and optional edits.',
      },
      {
        role: 'Agency designer or account manager',
        pain: 'Keep several clients’ rules straight and avoid late rejections or unannounced guideline changes.',
        provides: 'Separate workspace and rules per client, assigned projects and an approval trail.',
      },
      {
        role: 'Brand or marketing manager',
        pain: 'Control quality without reading every draft; the same corrections keep recurring.',
        provides: 'Risk-sorted review queue, approval gates and insights on repeated mistakes and unclear rules.',
      },
      {
        role: 'Legal or compliance reviewer',
        pain: 'Substantiate claims; problems are found late and cross-checked manually against product documents.',
        provides: 'Claim–evidence table, optional regulatory packs, escalation and an audit trail.',
      },
      {
        role: 'Admin or brand-ops lead',
        pain: 'Keep the knowledge base current and confidential; manage versions and access.',
        provides: 'Versioned knowledge base, sensitivity classes, role-based permissions, disclosure ledger and local-model mode.',
      },
    ],
    hypotheses: [
      { id: 'H1', text: 'Creators often do not know which guideline applies while they write.', method: 'Interviews, survey' },
      { id: 'H2', text: 'Rejections frequently lack an actionable reason or source, causing repeat rounds.', method: 'Observation, interviews' },
      { id: 'H3', text: 'Reviewers repeat the same corrections across pieces.', method: 'Workflow observation, tally' },
      { id: 'H4', text: 'Teams drafting with AI have no practical way to verify claims against approved facts.', method: 'Interviews, survey' },
      { id: 'H5', text: 'Confidentiality concerns limit sending brand material to cloud AI.', method: 'Interviews, survey' },
      { id: 'H6', text: 'Real guidelines contain vague wording (“friendly”, “where appropriate”) that reviewers read differently.', method: 'Guideline artefact analysis' },
    ],
    researchPlanNotice: 'Planned, not completed. Research ethics: informed consent, anonymised notes, no confidential materials collected without permission.',
  },

  solution: {
    principles: [
      { principle: 'Evidence first', detail: 'A finding without a rule or source ID cannot be shown. Each finding lists the passage, clause or fact, reason, confidence and method (deterministic, AI or hybrid).' },
      { principle: 'Abstain when unsure', detail: '“Unsupported” is not “wrong”. Low-confidence or source-less judgements are labelled Needs human judgement.' },
      { principle: 'Human decides', detail: 'Creators accept, edit or dismiss; reviewers override with a reason; managers approve. No automatic rewriting, approval or publishing.' },
      { principle: 'Confidential by design', detail: 'Data classes, minimal sharing with external AI, PII redaction, a local-model mode and a disclosure ledger.' },
    ],
    modules: [
      { module: 'Brand Knowledge Hub', capability: 'Import guidelines, messaging, glossary, facts, claims policy, disclaimers, visual rules and assets. Stable ID, owner, source, version, effective date and status.' },
      { module: 'Content Intake and Purpose Card', capability: 'Paste text or submit supported files; capture goal, audience, key message, CTA and must-keep phrases.' },
      { module: 'Verification Engine', capability: 'Deterministic rules, approved-source retrieval, tone analysis and supported visual and accessibility checks.' },
      { module: 'Explainable Finding Cards', capability: 'Exact excerpt, category, severity, confidence, method, rule or source ID, rationale and suggested correction.' },
      { module: 'Remediation Co-pilot', capability: 'Suggests minimal edits, re-checks the rule and confirms that goal, key message, CTA and locked phrases survive.' },
      { module: 'Approval Workspace', capability: 'Comments, assignments, version diffs, approve, request changes or reject, exceptions and an audit trail.' },
      { module: 'Governance Insights', capability: 'Aggregates recurring mistakes, overrides, reviewer disagreements and unclear rules.' },
    ],
    detectionCategories: [
      { category: 'Tone and voice', method: 'AI rubric with do and don’t examples, plus lexical features.', source: 'Voice and tone guidelines. Advisory; reviewer can override.' },
      { category: 'Terminology', method: 'Deterministic phrase and lemma matching.', source: 'Approved glossary; handles quotations and technical exceptions.' },
      { category: 'Messaging', method: 'Hybrid retrieval, AI and rules.', source: 'Messaging framework and mandatory-text rules.' },
      { category: 'Facts', method: 'Entity extraction, retrieval and verifier.', source: 'Versioned approved-facts register. Model memory is never treated as company approval.' },
      { category: 'Promotional claims', method: 'Pattern detection plus substantiation lookup.', source: 'Claims policy and substantiation files; ambiguity is escalated.' },
      { category: 'Visual consistency', method: 'OpenCV with CIEDE2000; multimodal AI as advisory only.', source: 'Visual guidelines and asset library; low confidence goes to a human.' },
      { category: 'Accessibility', method: 'WCAG formulae; AI may assess alt-text quality.', source: 'WCAG 2.2 AA as design reference; automated checks do not certify conformance.' },
      { category: 'AI and disclosure', method: 'Rules plus creator declaration.', source: 'Organisation disclosure policy and applicable legal review.' },
    ],
  },

  workflow: {
    steps: [
      { num: '1', who: 'Admin or brand manager', action: 'Imports guidelines, approved facts with validity dates, glossary and assets. Stable IDs assigned.', control: 'Nothing active until authorised manager reviews and publishes version 1.' },
      { num: '2', who: 'Creator', action: 'Submits text/image, completes Purpose Card and declares AI use.', control: 'Creator controls declared goal, audience, CTA, and must-keep phrases.' },
      { num: '3', who: 'System', action: 'Runs deterministic checks, retrieves active sources, applies AI judgement with cited IDs, then verifies in code.', control: 'Low confidence marked Needs human judgement. Cannot invent source IDs.' },
      { num: '4', who: 'System and creator', action: 'Finding cards displayed with diff suggestion. Creator accepts, edits, dismisses with reason, or requests review.', control: 'No automatic edits; every human action is logged.' },
      { num: '5', who: 'System', action: 'Edit creates new version. Affected checks re-run and Purpose Card constraints verified.', control: 'Locked phrases are preserved, or suggestion is tagged as alternative.' },
      { num: '6', who: 'Reviewer', action: 'Works risk-sorted queue; confirms or overrides findings (reason required); approves routine items or requests changes.', control: 'Reviewer can override at any time.' },
      { num: '7', who: 'Brand manager', action: 'Gate rules escalate sensitive items, such as an overridden Blocker or unsupported claim.', control: 'Final approval is always human.' },
      { num: '8', who: 'System', action: 'Issues approval certificate (versions, findings, decisions, AI disclosure) and updates insights.', control: 'Managers, not AI, approve guideline changes.' },
    ],
    stateProgression: 'Draft → Submitted → AI-reviewed → Changes requested ↔ Revised → In human review → Approved or Rejected → Exported',
  },

  scope: {
    tiers: [
      { tier: 'MVP (Round 2): must have', features: 'Roles and workspace isolation; knowledge base with approved-facts register and glossary; text submission and purpose card; terminology and required-message checks; retrieval-grounded claim review; explainable findings; suggestion and re-check; comments, approval states, versions and audit log; AI and data-disclosure panel.' },
      { tier: 'MVP: should have', features: 'DOCX and PDF text extraction; PNG and JPG asset allow-list; basic contrast and alt-text checks; exportable review and approval report; initial recurring-issue dashboard.' },
      { tier: 'Finish (Round 3)', features: 'Guideline ambiguity radar and insights dashboard; Confidential Mode (local models); optional regulatory packs (ASCI, CCPA, WCAG 2.2); review API and webhooks; Slack, Teams and email notifications; PDF approval certificate; evaluation report and hardening.' },
      { tier: 'Stretch', features: 'Browser extension (Docs, Notion, WordPress, LinkedIn); PPTX review; Google Drive import; Figma or Canva plug-in; Hindi and Hinglish tone checks; agency guest portal; CMS publishing integrations.' },
      { tier: 'Out of scope', features: 'Video or audio review, automatic publishing, image generation, legal advice or certification of compliance, and training models on customer data.' },
    ],
    threeImprovements: [
      { name: '1. Proof-or-abstain claim verification', desc: 'Each factual or promotional claim is extracted, linked to approved-fact entries and labelled Supported, Contradicted, Unsupported or Needs human. 100% of shown findings carry a rule or source ID.' },
      { name: '2. Intent-preserving suggestions with a multi-modal pass', desc: 'A purpose card with locked phrases. Each suggestion is re-checked twice: the violated rule is re-run, and goal, key message and CTA are confirmed intact. Zero deletions of locked phrases.' },
      { name: '3. Guideline-clarity and recurring-mistake radar', desc: 'Per-rule ambiguity score from override rate, reviewer disagreement, and low retrieval margin. Proposes clearer wording that a manager approves as a new guideline version.' },
    ],
  },

  technical: {
    pipeline: [
      { name: 'Ingest and normalise', desc: 'Parse to structured blocks with character offsets. Unsupported or unreadable elements reported, never silently skipped. Content treated as untrusted data.' },
      { name: 'Deterministic layer', desc: 'Glossary and mandatory-text matching; number, date and price extraction; WCAG contrast; reading-level checks. Reproducible, no AI.' },
      { name: 'Retrieval', desc: 'BM25 keyword search over active, approved rules and facts only. Superseded versions are never retrievable. Guidelines version recorded.' },
      { name: 'AI judgement', desc: 'Low-temperature Gemini model sees only passage and retrieved rules. Delimited with <<<CONTENT>>>. Must return schema-valid JSON.' },
      { name: 'Verification (code)', desc: 'Code checks that cited IDs exist, quoted span literally occurs, and severity is capped. Failures dropped or downgraded.' },
      { name: 'Suggest, re-check, persist', desc: 'Minimal change diffs. Original draft preserved in version history. Logged to disclosure ledger.' },
    ],
  },

  responsible: {
    areas: [
      { area: 'Human oversight', commitment: 'AI never publishes, approves, rejects or finally edits anything. Deterministic checks flag violations; AI findings are advisory. Blockers need human sign-off. Every override needs a reason.' },
      { area: 'Privacy & confidentiality', commitment: 'Private workspaces; data classes (Public, Internal, Confidential); TLS in transit; PII redaction gateway before external calls; local Confidential Mode; zero customer training.' },
      { area: 'Security', commitment: 'Server-side authorisation on every endpoint; input validation (20k chars max, 5MB file max); append-only audit log; secrets in env vars only; dependency scanning.' },
      { area: 'Transparency', commitment: 'Every finding shows passage, reason, source ID, confidence and method. Disclosure ledger records provider and model. Notice that Pramaan supports, not replaces, legal review.' },
      { area: 'Fairness & inclusion', commitment: 'Indian English spelling and style calibrated; no demographic traits scored; insights team-level by default.' },
      { area: 'Accessibility', commitment: 'Design target WCAG 2.2 AA: semantic landmarks, visible focus ring, keyboard navigation, light and dark theme contrast.' },
    ],
  },

  positioning: {
    comparison: [
      { platform: 'Brand DAM (Frontify, Bynder)', strength: 'Central guidelines and asset access.', gap: 'They inform or control access but do not review new drafts against approved facts and rules.' },
      { platform: 'Template tools (Marq)', strength: 'Locked templates keep layouts on brand.', gap: 'They miss wrong claims or off-tone copy written inside the template.' },
      { platform: 'AI style checkers (Acrolinx, Writer)', strength: 'Enterprise language and terminology checks.', gap: 'Pramaan adds approved-fact provenance, purpose-preserving fixes, and guideline ambiguity analytics.' },
      { platform: 'General AI assistants', strength: 'Flexible instant feedback.', gap: 'Lack approved sources, role-based approvals, version diffs, and disclosure ledgers.' },
    ],
    genuinelyNew: [
      'Claim provenance ledger linking copy to active approved facts.',
      'Purpose-preserving correction ensuring locked phrases survive.',
      'Guideline ambiguity radar measuring which rules are unclear.',
      'Disclosure ledger and Confidential Mode built into the core loop.',
    ],
  },

  feasibility: {
    rationale: 'Assembles proven components (FastAPI, SQLite/PostgreSQL, BM25, Gemini API, Tailwind) rather than inventing them, building one narrow text-first workflow end to end.',
    risks: [
      { risk: 'AI invents or misattributes a finding', mitigation: 'Schema-enforced IDs; code verifier checks ID existence and quote occurrence; abstain or downgrade.' },
      { risk: 'Missed violations (false negatives)', mitigation: 'Deterministic checks wherever rules exist; golden test set with recall targets; reviewers remain safety net.' },
      { risk: 'Automation bias', mitigation: 'Confidence and method shown; Needs human judgement bucket; mandatory human approval; no auto-apply.' },
      { risk: 'API cost, latency or outage', mitigation: 'Caching, low-temperature prompt, provider-agnostic adapter with local fallback.' },
      { risk: 'Scope creep', mitigation: 'MoSCoW list; strict cut order; core loop protected first.' },
    ],
    knownLimits: [
      'Tone and visual consistency are partly subjective; automated output can produce false positives.',
      'Source-linked check confirms match to approved record; cannot guarantee record itself is legally sufficient.',
      'Automation cannot establish full legal compliance or WCAG conformance; human review remains necessary.',
    ],
  },

  delivery: {
    teamName: 'DOOM_CODER',
    teamSize: 'Solo participant',
    teamLead: 'Sitanshu Kumar · B.Tech Computer Science Engineering (2024–2028), Rungta International Skill University, Durg, Chhattisgarh',
    roleAllocation: 'Solo participant owning all workstreams: Architecture, AI pipeline, backend and security, frontend and UX, research and QA, documentation.',
    workstreams: [
      { workstream: 'AI and retrieval', round2: 'Pipeline v1, BM25, Gemini adapter, verifier, PII gateway', round3: 'Hybrid dense vector retrieval, evaluation hardening' },
      { workstream: 'Backend & security', round2: 'FastAPI, SQLite, RBAC, checks, audit log, disclosure ledger', round3: 'Collaborative threads, enterprise SSO, webhook triggers' },
      { workstream: 'Frontend & UX', round2: 'Design system, finding cards, review workspace, hub, audit', round3: 'Live WebSocket presence, multi-modal scanner UI' },
      { workstream: 'QA & docs', round2: 'Golden set benchmarks, security role matrix, full documentation', round3: 'Lighthouse audits, user study report' },
    ],
  },

  references: [
    { num: 1, title: 'MarketingProfs, “Are businesses creating and using brand guidelines?” (Marq/Lucidpress survey data), 2021.', url: 'https://www.marketingprofs.com/charts/2021/45661/are-businesses-creating-and-using-brand-guidelines' },
    { num: 2, title: 'Lucidpress, “Study finds companies with consistent branding can see up to 33% increase in revenue”, PR Newswire, 2019.', url: 'https://www.prnewswire.com/news-releases/study-finds-companies-with-consistent-branding-can-see-up-to-33-increase-in-revenue-300967219.html' },
    { num: 3, title: 'Advertising Standards Council of India (ASCI), Annual Complaints Report 2024–25, press release, May 2025.', url: 'https://ascionline.in/wp-content/uploads/2025/05/ASCI-Press-Release-Annual-Complaints-Report-2024-25-1.pdf' },
    { num: 4, title: 'ASCI, Half-Yearly Complaints Report, April–September 2025.', url: 'https://ascionline.in/wp-content/uploads/2025/11/ASCI-Half-Yearly-Complaints-Report-2025-26.pdf' },
    { num: 5, title: 'WebAIM, The WebAIM Million (2026 report; analysis of Feb 2026).', url: 'https://webaim.org/projects/million/' },
    { num: 6, title: 'Moffatt v. Air Canada, 2024 BCCRT 149 (Civil Resolution Tribunal of British Columbia, Feb 2024).', url: 'https://canlii.ca/t/k2spq' },
    { num: 7, title: 'MeitY, Information Technology Amendment Rules, 2026 (notified 10 Feb 2026). Legal summary.', url: 'https://www.mondaq.com/india/it-and-internet/1773560/government-notifies-information-technology-amendment-rules-2026' },
    { num: 8, title: 'MeitY, Digital Personal Data Protection Rules, 2025 (notified 13 Nov 2025). Secondary law-firm summary.', url: 'https://meity.gov.in' },
    { num: 9, title: 'W3C, Web Content Accessibility Guidelines (WCAG) 2.2.', url: 'https://www.w3.org/TR/WCAG22/' },
    { num: 10, title: 'Product category references: Acrolinx, Marq, Rocketium creative-compliance.', url: 'https://acrolinx.com' },
    { num: 11, title: 'PwC India, Voice of the Consumer Survey 2024: India Perspective.', url: 'https://www.pwc.in/voiceofconsumer2024' },
    { num: 12, title: 'Storyblok, consumer survey on brand consistency (200 respondents, Mar 2026).', url: 'https://storyblok.com' },
    { num: 13, title: 'NIST, AI Risk Management Framework and AI RMF Playbook (voluntary reference).', url: 'https://nist.gov' },
    { num: 14, title: 'Inkloom AI, CodeNexus India 2026 Round 1 Problem Statement and Rules.', url: 'https://pramaan.dev' },
  ],
};

