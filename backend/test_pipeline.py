"""Quick smoke test: analyse the seed document and print results."""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.seed import SEED_DOCUMENT
from app.detection import analyze_document

spans = analyze_document(SEED_DOCUMENT)

print(f"Total spans detected: {len(spans)}\n")
print(f"{'Status':<12} {'Type':<15} {'Text':<55} {'Recognizer'}")
print("-" * 120)

for s in spans:
    tag = "[RED]" if s.status.value == "redacted" else "[NM] "
    print(
        f"{tag} {s.status.value:<10} "
        f"{s.type.value:<15} "
        f"{repr(s.text[:50]):<55} "
        f"{s.matched_recognizer}"
    )

print("\n--- Verification Check ---")
redacted = [s for s in spans if s.status.value == "redacted"]
near_miss = [s for s in spans if s.status.value == "nearMiss"]
print(f"Redacted: {len(redacted)}")
print(f"Near Miss: {len(near_miss)}")

# Check specific expectations
expectations = {
    "All phones redacted": all(
        s.status.value == "redacted"
        for s in spans
        if s.type.value == "phone"
    ),
    "All emails redacted": all(
        s.status.value == "redacted"
        for s in spans
        if s.type.value == "email"
    ),
    "All SSNs redacted": all(
        s.status.value == "redacted"
        for s in spans
        if s.type.value == "ssn"
    ),
    "Apple Inc. is nearMiss": any(
        s.status.value == "nearMiss" and "Apple" in s.text
        for s in spans
    ),
    "Sherlock Holmes is nearMiss": any(
        s.status.value == "nearMiss" and "Sherlock Holmes" in s.text
        for s in spans
    ),
    "Elon Musk is nearMiss": any(
        s.status.value == "nearMiss" and "Elon Musk" in s.text
        for s in spans
    ),
    "1 Infinite Loop is nearMiss": any(
        s.status.value == "nearMiss" and "Infinite Loop" in s.text
        for s in spans
    ),
    "1600 Pennsylvania Ave is nearMiss": any(
        s.status.value == "nearMiss" and "Pennsylvania" in s.text
        for s in spans
    ),
    "742 Evergreen Terrace full address redacted": any(
        s.status.value == "redacted"
        and "742 Evergreen Terrace" in s.text
        and "62704" in s.text
        for s in spans
    ),
}

print("\n--- Expected Results ---")
all_pass = True
for label, result in expectations.items():
    icon = "PASS" if result else "FAIL"
    print(f"  [{icon}] {label}")
    if not result:
        all_pass = False

if all_pass:
    print("\n=== ALL CHECKS PASSED ===")
else:
    print("\n=== SOME CHECKS FAILED ===")
    # Show details for failing checks
    print("\nPhone spans:")
    for s in spans:
        if s.type.value == "phone":
            print(f"  {s.status.value}: {repr(s.text)}")
    print("\nAddress spans:")
    for s in spans:
        if s.type.value == "address":
            print(f"  {s.status.value}: {repr(s.text)}")
    print("\nOrganization/Name spans with 'Apple', 'Sherlock', 'Elon', 'Infinite', 'Pennsylvania':")
    for s in spans:
        if any(kw in s.text for kw in ["Apple", "Sherlock", "Elon", "Infinite", "Pennsylvania"]):
            print(f"  {s.status.value} ({s.type.value}): {repr(s.text)}")
