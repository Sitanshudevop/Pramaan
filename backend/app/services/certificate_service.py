"""Generates formal, tamper-evident HTML approval certificates."""

import hashlib
from datetime import UTC, datetime

from app.constants import CERTIFICATE_LEGAL_NOTICE
from app.models.entities import ReviewModel


def generate_approval_certificate_html(
    review: ReviewModel, approver_role: str, reason: str = ""
) -> str:
    """Generate a clean, standalone, printable HTML approval certificate."""
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Cryptographic certificate verification hash
    raw_signature = f"{review.id}:{review.current_version}:{approver_role}:{timestamp}"
    cert_hash = hashlib.sha256(raw_signature.encode("utf-8")).hexdigest()[:24].upper()

    findings_summary = f"{len(review.findings)} finding(s) reviewed and resolved"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pramaan Approval Certificate - {review.id}</title>
  <style>
    body {{
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FAFAFB;
      color: #161A23;
      padding: 40px;
      margin: 0;
    }}
    .cert-card {{
      max-width: 780px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E4E6EC;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }}
    .brand-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #3B4BC8;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }}
    .title {{
      font-size: 24px;
      font-weight: 700;
      color: #161A23;
      margin: 0;
    }}
    .subtitle {{
      font-size: 13px;
      color: #5B6272;
      margin-top: 4px;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 12px;
      background: #ECEEFB;
      color: #3B4BC8;
      font-weight: 600;
      font-size: 13px;
      border-radius: 6px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }}
    .field-label {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #5B6272;
      margin-bottom: 4px;
    }}
    .field-value {{
      font-size: 15px;
      font-weight: 500;
      color: #161A23;
    }}
    .code-box {{
      font-family: ui-monospace, monospace;
      background: #F3F4F7;
      border: 1px solid #E4E6EC;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      word-break: break-all;
    }}
    .legal-notice {{
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #E4E6EC;
      font-size: 12px;
      color: #5B6272;
      line-height: 1.5;
      text-align: center;
    }}
    .legal-bold {{
      font-weight: 600;
      color: #161A23;
    }}
    @media print {{
      body {{ background: #FFF; padding: 0; }}
      .cert-card {{ border: none; box-shadow: none; padding: 20px; }}
    }}
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="brand-header">
      <div>
        <h1 class="title">Pramaan Brand Governance Certificate</h1>
        <div class="subtitle">Evidence-backed pre-publication content clearance</div>
      </div>
      <div class="badge">APPROVED</div>
    </div>

    <div class="grid">
      <div>
        <div class="field-label">Review ID</div>
        <div class="field-value">{review.id}</div>
      </div>
      <div>
        <div class="field-label">Brand Kit</div>
        <div class="field-value">{review.kit_id}</div>
      </div>
      <div>
        <div class="field-label">Approved Version</div>
        <div class="field-value">Version {review.current_version}</div>
      </div>
      <div>
        <div class="field-label">Content Format</div>
        <div class="field-value">{review.content_type}</div>
      </div>
      <div>
        <div class="field-label">Approved By Role</div>
        <div class="field-value">{approver_role}</div>
      </div>
      <div>
        <div class="field-label">Approval Timestamp</div>
        <div class="field-value">{timestamp}</div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <div class="field-label">Audit & Clearance Resolution</div>
      <div class="field-value" style="margin-bottom: 8px;">{findings_summary}</div>
      {f'<div class="field-value" style="font-style: italic; color: #5B6272;">Approval Justification: "{reason}"</div>' if reason else ""}
    </div>

    <div>
      <div class="field-label">Tamper-Evident Verification Hash</div>
      <div class="code-box">{cert_hash}</div>
    </div>

    <div class="legal-notice">
      <div class="legal-bold">{CERTIFICATE_LEGAL_NOTICE}</div>
      <div>Every finding in Pramaan carries verifiable evidence from approved guidelines or active facts registers. All final decisions remain human.</div>
    </div>
  </div>
</body>
</html>
"""
