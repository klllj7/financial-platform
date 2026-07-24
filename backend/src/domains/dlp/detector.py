import re

PII_PATTERNS = {
    "resident_number": r"\d{6}-\d{7}",
    "phone_number": r"01[0-9]-\d{3,4}-\d{4}",
}

def detect_pii(text: str) -> list[dict]:
    results = []

    for pii_type, pattern in PII_PATTERNS.items():
        for match in re.finditer(pattern, text):
            results.append({
                "type": pii_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end(),
            })
    return results

if __name__ == "__main__":
    sample = "제 주민번호는 901231-1234567이고, 연락처는 010-1234-5678입니다."
    print(detect_pii(sample))

def mask_text(text: str, detected: list[dict]) -> str:
    masked = text
    for d in sorted(detected, key=lambda d: d["start"], reverse=True):
        masked = masked[:d["start"]] + "*" * (d["end"] - d["start"]) + masked[d["end"]:]
    return masked

PII_GRADES = {
    "resident_number": "HIGH",
    "phone_number": "MEDIUM"
}

GRADE_ORDER = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

def compute_grade(detected: list[dict]) -> str | None:
    if not detected:
        return None
    grades = [PII_GRADES.get(d["type"], "LOW") for d in detected]
    return max(grades, key=lambda g: GRADE_ORDER[g])