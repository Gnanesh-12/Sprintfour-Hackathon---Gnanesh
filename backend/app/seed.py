"""
Seed document for the Conseal Trust Center.

This document is carefully crafted to include:
- Multiple PII types (name, phone, email, address, SSN, date)
- Near-miss entities (fictional characters, public companies, public addresses)
- Edge cases (adjacent entities, duplicate names)
- Enough context to demonstrate the rationale engine

The seed document simulates a realistic internal memo that Marcus
might want to share with an AI assistant.
"""

SEED_DOCUMENT = """CONFIDENTIAL — Internal Case Review

Date: January 15, 2025

Prepared by: Sarah Mitchell
Department: Risk & Compliance

---

Subject: Client Onboarding Review — Case #2024-0892

This memo summarizes the findings from our review of the onboarding documentation submitted by Jonathan Parker for his new investment account.

Client Information:
- Full Name: Jonathan Parker
- Date of Birth: March 12, 1985
- Social Security Number: 482-91-7834
- Phone: (555) 847-2931
- Email: j.parker@personalmail.com
- Mailing Address: 742 Evergreen Terrace, Springfield, IL 62704

Employment Verification:
Jonathan Parker is currently employed as a Senior Financial Analyst at Apple Inc., located at 1 Infinite Loop, Cupertino, CA 95014. His employment was verified through direct contact with the HR department on December 3, 2024.

Background Check Summary:
The background check was conducted by our compliance team. No adverse findings were reported. The applicant's credit score of 780 was obtained on November 28, 2024. Previous addresses include 1600 Pennsylvania Avenue, Washington, DC 20500 and 221B Baker Street, London, UK.

References:
Jonathan listed the following references:
1. Dr. Emily Chen — (555) 293-4817 — emily.chen@hospital.org
2. Michael Torres — (555) 182-9374 — m.torres@techcorp.net

Notes:
During the review, Jonathan mentioned that he is a fan of the fictional detective Sherlock Holmes and enjoys reading mystery novels. He also referenced a recent article about Elon Musk's latest venture in the technology sector.

Risk Assessment:
Based on our analysis, Jonathan Parker presents a LOW risk profile. His documentation is complete, employment is verified, and no adverse findings were discovered during the background check.

The recommended next step is to proceed with account activation pending final approval from the compliance director, Robert Williams, who can be reached at r.williams@conseal.io or (555) 739-2841.

— End of Memo —
Sarah Mitchell
Risk & Compliance Division
Employee ID: EMP-20198
"""
