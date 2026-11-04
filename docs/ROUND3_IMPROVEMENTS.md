# Round 3 Planned Improvements

As specified in the project roadmap, these three high-impact improvements are scoped for Round 3:

---

## 1. Hybrid Dense-Sparse Vector Retrieval (`pgvector` + BM25)
- Transition from pure in-memory BM25 retrieval to a hybrid retrieval architecture combining dense vector embeddings (e.g., `text-embedding-3-small` or local `bge-small-en-v1.5`) with sparse BM25 scoring via reciprocal rank fusion (RRF).
- Enables conceptual matching of semantic brand voice guidelines even when vocabulary differs completely, while preserving exact keyword guarantees for product terminology and legal claims.

---

## 2. Collaborative Multi-Party Review Workflows with Real SSO & RBAC
- Upgrade from demo-role switching (`X-Demo-Role`) to enterprise SSO (SAML 2.0 / OIDC) and granular role-based access control (RBAC) supporting external agency tenants.
- Introduce line-by-line collaborative commenting threads, threaded reviewer approvals, live WebSocket presence indicators, and automated Slack/Teams notification hooks on review status changes.

---

## 3. Sandboxed Multi-Modal Document & Video Frame Compliance Scanner
- Expand beyond text and static image contrast/palette checks into comprehensive multi-modal governance:
  - Sandboxed PDF/DOCX layout parsing with typographic hierarchy and brand font validation.
  - Video asset compliance: automated audio track transcription, on-screen text (OCR) extraction, logo safe-margin detection, and strobe/photosensitivity checks (WCAG 2.3.1).
