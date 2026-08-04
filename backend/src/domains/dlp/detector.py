import re

# 숫자형 PII 패턴에는 (?<!\d) / (?!\d) 경계를 붙인다.
# 경계가 없으면 긴 숫자열 한가운데를 잘라내서 매칭하는 오탐이 난다.
# (예: "1234567-12345678" 안에서 "234567-1234567"을 주민번호로 오탐)
PII_PATTERNS = {
    # 앞 6자리는 실제 존재하는 생년월일(YYMMDD) 형태여야 하고,
    # 뒤 첫 자리는 성별·국적 코드(1~8)만 허용한다.
    "resident_number": r"(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-[1-8]\d{6}(?!\d)",
    # 국내에서 실제 사용하는 이동통신 식별번호만 허용한다.
    "phone_number": r"(?<!\d)01[016789]-\d{3,4}-\d{4}(?!\d)",
    # 형태만으로는 날짜·버전 문자열과 구분되지 않아서
    # _looks_like_account()로 자릿수·날짜 여부를 한 번 더 검증한다.
    "account_number": r"(?<!\d)\d{2,6}-\d{2,6}-\d{2,10}(?!\d)",
    "card_number": r"(?<!\d)\d{4}-\d{4}-\d{4}-\d{4}(?!\d)",
    "email": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
}

# 프롬프트 인젝션·탈옥 시도를 잡기 위한 패턴이다.
# PII와 달리 마스킹으로 의미가 살지 않으므로 탐지되면 항상 차단한다.
#
# 인젝션은 미탐(FN) 피해가 오탐(FP)보다 크기 때문에 임계값을 느슨하게 풀지 않는다.
# 다만 "jailbreak"처럼 단어 하나만으로 매칭하던 패턴은, 보안·컴플라이언스 업무 특성상
# 탈옥 공격 자체를 설명·교육 목적으로 질문하는 정상 대화까지 막아버려서
# 실제 공격 명령 형태일 때만 걸리도록 좁혔다.
PROMPT_INJECTION_PATTERNS = {
    "prompt_injection": [
        r"이전\s*(지시|명령|규칙)(사항)?\s*(를|을)?\s*(모두\s*)?무시",
        r"지금까지의?\s*(지시|명령|규칙)\s*(를|을)?\s*무시",
        r"(시스템|초기)\s*프롬프트\s*(를|을)?\s*(알려|보여|출력)",
        # 문장 중간에 우연히 걸리지 않도록 문장 첫머리에서 시작할 때만 인정한다.
        r"(?:^|[.!?\n]\s*)(?:너는\s*이제부터|지금부터\s*너는)",
        # "disregard the above rules"처럼 관사·수식어가 끼는 변형도 잡는다.
        r"(ignore|disregard|forget)\s+(all\s+|any\s+|the\s+|your\s+)*(previous|above|prior|earlier|preceding)\s+(instructions?|rules?|prompts?|directions?)",
        r"reveal\s+(your\s+)?(system\s+)?prompt",
        r"you\s+are\s+now\s+(DAN|in\s+developer\s+mode)",
        r"\bDAN\b.*do\s+anything\s+now",
        r"act\s+as\s+(if\s+you\s+(are|have)|an?)\s+.*\b(no\s+restrictions?|unfiltered|jailbroken)\b",
        # "jailbreak란 무엇인가요" 같은 설명 요청은 통과시키고 명령형만 잡는다.
        r"\b(enter|activate|enable|do)\s+(a\s+|the\s+)?jail\s?break",
        r"\bjail\s?break\s+(this|you|yourself|the\s+(model|ai|system|assistant))\b",
        r"\bjailbroken\b",
        r"탈옥\s*(모드로?)?\s*(해줘|해봐|하자|시켜|전환)",
    ],
}

# PII/인젝션 패턴을 하나의 딕셔너리로 합쳐서 detect_pii에서 함께 순회한다.
ALL_PATTERNS = {**PII_PATTERNS, **{k: "|".join(f"(?:{p})" for p in v) for k, v in PROMPT_INJECTION_PATTERNS.items()}}

# 계좌번호로 인정할 총 자릿수 범위(국내 은행 계좌는 보통 10~14자리).
ACCOUNT_MIN_DIGITS = 10
ACCOUNT_MAX_DIGITS = 16


def _looks_like_account(value: str) -> bool:
    """
    "2024-01-15"(날짜), "1.0.0-2024-0101"(버전), "10-20-30"(단순 수치 나열)처럼
    계좌번호 정규식에 걸리지만 실제로는 계좌번호가 아닌 문자열을 걸러낸다.
    """
    groups = value.split("-")
    digits = sum(len(g) for g in groups)
    if not (ACCOUNT_MIN_DIGITS <= digits <= ACCOUNT_MAX_DIGITS):
        return False

    # YYYY-MM-DD 형태의 날짜는 계좌번호로 보지 않는다.
    if len(groups) == 3 and len(groups[0]) == 4 and 1900 <= int(groups[0]) <= 2099:
        month, day = int(groups[1]), int(groups[2])
        if 1 <= month <= 12 and 1 <= day <= 31:
            return False
        # "2024-2025-2026"처럼 연도만 나열한 경우도 제외한다.
        if all(len(g) == 4 and 1900 <= int(g) <= 2099 for g in groups):
            return False

    return True


# 정규식 매칭 뒤에 추가 검증이 필요한 유형만 등록한다.
POST_VALIDATORS = {
    "account_number": _looks_like_account,
}

# 마스킹이 아니라 항상 차단해야 하는 탐지 유형이다.
# confidential_similarity는 embedding_detector.py에서 생성되는 유형으로,
# 특정 구간이 아니라 문장 전체의 의미로 판단하는 것이라 마스킹이 의미가 없어 차단한다.
BLOCK_TYPES = {"resident_number", "prompt_injection", "confidential_similarity"}


def detect_pii(text: str) -> list[dict]:
    candidates = []

    for pii_type, pattern in ALL_PATTERNS.items():
        validator = POST_VALIDATORS.get(pii_type)
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            value = match.group()
            if validator and not validator(value):
                continue
            candidates.append({
                "type": pii_type,
                "value": value,
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
