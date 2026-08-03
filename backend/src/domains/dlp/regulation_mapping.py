# detection_type(detector.py/embedding_detector.py가 내려주는 탐지 유형 코드)을
# 관련 법 조항에 연결하기 위한 매핑표.
# law_name의 "문서명 + 조항번호" 부분은 하드코딩하지 않고 clause_id로 regulation_clause
# 테이블을 가리켜서, D 담당자가 규제 관리 화면에서 조항 제목을 고쳐도 여기서 자동으로
# 반영되게 한다. 다만 같은 조 안에서 항/호 단위로 더 세분화해서 표시하고 싶은 경우,
# 그 세분화 때문에 조항이 사실상 같은 원문 조문(예: 제34조)에 대해 여러 건으로
# DB에 중복 등록되는 걸 막기 위해 sub_locator(옵션)로 "제1항제1호" 같은 항/호 텍스트만
# 코드에서 뒤에 붙인다. 조문 본문이 바뀌지 않는 한 항/호 번호는 거의 안 바뀌는 값이라
# 하드코딩 리스크가 낮다고 판단함.
# severity는 이벤트의 grade(같은 이벤트에 여러 유형이 섞이면 그 중 최댓값)를 그대로
# 쓰지 않고, 조항별 법적 위반 소지의 경중을 detector.py의 PII_GRADES 기준에 맞춰
# 고정값으로 매긴다. 예: 계좌번호 하나만 잡힌 이벤트와 기밀정보 유사까지 겹쳐서
# grade가 HIGH로 올라간 이벤트가 있어도, 계좌번호 조항 자체의 심각도는 항상 MEDIUM.
REGULATION_MAPPING = {
    "resident_number": {
        "regulation_code": "REG-01",
        "clause_id": 28,  # 개인정보 보호법 제23조 (민감정보의 처리 제한)
        "severity": "HIGH",
        "legal_issue": "주민등록번호 등 민감정보가 별도 동의 없이 처리되었을 위험",
        "recommended_action": "해당 발화 차단 여부 확인 및 민감정보 처리 동의 절차 점검",
    },
    "account_number": {
        "regulation_code": "REG-02",
        "clause_id": 31,  # 개인정보 보호법 제29조 (안전조치의무)
        "severity": "MEDIUM",
        "legal_issue": "계좌번호 등 금융정보 유출 시 안전조치의무 위반 소지",
        "recommended_action": "마스킹 처리 여부 확인 및 접속 로그 점검",
    },
    "card_number": {
        "regulation_code": "REG-03",
        "clause_id": 31,  # 개인정보 보호법 제29조 (안전조치의무)
        "severity": "HIGH",
        "legal_issue": "카드번호 등 금융정보 유출 시 안전조치의무 위반 소지",
        "recommended_action": "마스킹 처리 여부 확인 및 접속 로그 점검",
    },
    "phone_number": {
        "regulation_code": "REG-04",
        "clause_id": 27,  # 개인정보 보호법 제17조 (개인정보의 제공)
        "severity": "MEDIUM",
        "legal_issue": "휴대폰번호가 동의 없이 제3자에게 제공되었을 위험",
        "recommended_action": "제공 목적 및 동의 여부 확인",
    },
    "email": {
        "regulation_code": "REG-05",
        "clause_id": 27,  # 개인정보 보호법 제17조 (개인정보의 제공)
        "severity": "LOW",
        "legal_issue": "이메일 주소가 동의 없이 제3자에게 제공되었을 위험",
        "recommended_action": "제공 목적 및 동의 여부 확인",
    },
    "confidential_similarity": {
        "regulation_code": "REG-06",
        "clause_id": 37,  # 인공지능기본법 제34조 (고영향 인공지능과 관련한 사업자의 책무)
        "sub_locator": "제1항제1호",  # 제34조 중 위험관리방안의 수립·운영 부분
        "severity": "HIGH",
        "legal_issue": "사내 기밀·민감정보 유사 내용 처리에 대한 위험관리방안 미비 소지",
        "recommended_action": "위험관리방안 재점검 및 유사 사례 재발 방지 대책 수립",
    },
    "prompt_injection": {
        "regulation_code": "REG-07",
        "clause_id": 37,  # 인공지능기본법 제34조 (고영향 인공지능과 관련한 사업자의 책무)
        "sub_locator": "제1항",  # 제34조 중 위험관리방안 + 관리·감독을 포괄하는 부분
        "severity": "HIGH",
        "legal_issue": "프롬프트 인젝션 등 침해 시도에 대한 위험관리·관리감독 체계 미비 소지",
        "recommended_action": "위험관리방안 및 사람의 관리·감독 체계 점검",
    },
}


def build_clause_law_names(db) -> dict[int, str]:
    """REGULATION_MAPPING이 참조하는 clause_id들을 한 번에 조회해서
    {clause_id: "문서명 조항번호"} 형태의 조회용 딕셔너리를 만든다."""
    from models import RegulationClause, RegulationDocument

    clause_ids = {entry["clause_id"] for entry in REGULATION_MAPPING.values()}
    rows = (
        db.query(RegulationClause, RegulationDocument)
        .join(RegulationDocument, RegulationClause.doc_id == RegulationDocument.id)
        .filter(RegulationClause.id.in_(clause_ids))
        .all()
    )
    return {
        clause.id: f"{doc.doc_name} {clause.clause_no}"
        for clause, doc in rows
    }


def get_mapped_violations(
    detection_type: str | None, clause_law_names: dict[int, str]
) -> list[dict]:
    """콤마로 이어진 detection_type 문자열을 조항 정보로 변환한다.
    매핑표에 없는 유형은 결과에서 제외한다."""
    if not detection_type:
        return []

    types = [t.strip() for t in detection_type.split(",") if t.strip()]
    violations = []
    for t in types:
        entry = REGULATION_MAPPING.get(t)
        if entry is None:
            continue
        base_law_name = clause_law_names.get(entry["clause_id"])
        law_name = (
            base_law_name + entry.get("sub_locator", "")
            if base_law_name
            else "(조항 정보 없음 - 규제 관리에서 확인 필요)"
        )
        violations.append({
            "regulation_code": entry["regulation_code"],
            "law_name": law_name,
            "severity": entry["severity"],
            "legal_issue": entry["legal_issue"],
            "recommended_action": entry["recommended_action"],
        })
    return violations
