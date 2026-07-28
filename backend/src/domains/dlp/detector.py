import re

PII_PATTERNS = {
    "resident_number": r"\d{6}-\d{7}",
    "phone_number": r"01[0-9]-\d{3,4}-\d{4}",
    "account_number": r"\d{2,6}-\d{2,6}-\d{2,10}",
    "card_number": r"\d{4}-\d{4}-\d{4}-\d{4}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
}

# 프롬프트 인젝션·탈옥 시도를 잡기 위한 패턴이다.
# PII와 달리 마스킹으로 의미가 살지 않으므로 탐지되면 항상 차단한다.
PROMPT_INJECTION_PATTERNS = {
    "prompt_injection": [
        r"이전\s*(지시|명령|규칙)(사항)?\s*(를|을)?\s*(모두\s*)?무시",
        r"지금까지의?\s*(지시|명령|규칙)\s*(를|을)?\s*무시",
        r"(시스템|초기)\s*프롬프트\s*(를|을)?\s*(알려|보여|출력)",
        r"너는\s*이제부터",
        r"지금부터\s*너는",
        r"ignore\s+(all\s+)?(previous|above|prior)\s+instructions?",
        r"disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?)",
        r"reveal\s+(your\s+)?(system\s+)?prompt",
        r"you\s+are\s+now\s+(DAN|in\s+developer\s+mode)",
        r"\bDAN\b.*do\s+anything\s+now",
        r"act\s+as\s+(if\s+you\s+(are|have)|an?)\s+.*\b(no\s+restrictions?|unfiltered|jailbroken)\b",
        r"jailbreak",
    ],
}

# PII/인젝션 패턴을 하나의 딕셔너리로 합쳐서 detect_pii에서 함께 순회한다.
ALL_PATTERNS = {**PII_PATTERNS, **{k: "|".join(f"(?:{p})" for p in v) for k, v in PROMPT_INJECTION_PATTERNS.items()}}

# 마스킹이 아니라 항상 차단해야 하는 탐지 유형이다.
# confidential_similarity는 embedding_detector.py에서 생성되는 유형으로,
# 특정 구간이 아니라 문장 전체의 의미로 판단하는 것이라 마스킹이 의미가 없어 차단한다.
BLOCK_TYPES = {"resident_number", "prompt_injection", "confidential_similarity"}


def detect_pii(text: str) -> list[dict]:
    candidates = []

    for pii_type, pattern in ALL_PATTERNS.items():
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            candidates.append({
                "type": pii_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end(),
            })

    # 같은 구간을 여러 패턴이 동시에 잡는 경우(예: 전화번호가 계좌번호
    # 패턴에도 걸리는 경우)가 있어서, 더 길게(구체적으로) 매칭된 것부터
    # 우선 채택하고 이미 채택된 구간과 겹치는 후보는 버린다.
    candidates.sort(key=lambda d: (d["end"] - d["start"]), reverse=True)
    results = []
    for candidate in candidates:
        overlaps = any(
            candidate["start"] < r["end"] and candidate["end"] > r["start"]
            for r in results
        )
        if not overlaps:
            results.append(candidate)

    return sorted(results, key=lambda d: d["start"])

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
    "card_number": "HIGH",
    "prompt_injection": "HIGH",
    "confidential_similarity": "HIGH",
    "account_number": "MEDIUM",
    "phone_number": "MEDIUM",
    "email": "LOW",
}

GRADE_ORDER = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

def compute_grade(detected: list[dict]) -> str | None:
    if not detected:
        return None
    grades = [PII_GRADES.get(d["type"], "LOW") for d in detected]
    return max(grades, key=lambda g: GRADE_ORDER[g])
