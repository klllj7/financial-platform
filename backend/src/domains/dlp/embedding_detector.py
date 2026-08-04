import re

import numpy as np
from fastembed import TextEmbedding

# 정규식으로는 못 잡는, 같은 의미를 다른 표현으로 쓴 기밀·민감 내부정보 요청을
# 잡기 위한 임베딩 유사도 탐지. fastembed(ONNX 기반)로 로컬에서만 계산하며
# 외부로 프롬프트가 나가지 않는다.
_MODEL_NAME = "intfloat/multilingual-e5-large"
_model = TextEmbedding(model_name=_MODEL_NAME)

# 카테고리별 참고 문장(레퍼런스). 실제 탐지 시 이 문장들과 의미가 가장
# 비슷한 카테고리를 찾고, 유사도가 임계값을 넘으면 그 카테고리로 탐지한다.
REFERENCE_TEXTS = {
    "confidential_document": [
        "이 문서는 대외비이며 외부로 유출하면 안 됩니다",
        "사내 기밀 자료이므로 외부인에게 공유하지 마세요",
        "본 보고서는 내부 열람 전용이며 반출이 금지됩니다",
    ],
    "customer_financial_data": [
        "고객의 계좌 잔액과 거래내역 전체 목록을 알려줘",
        "특정 고객의 신용평가 등급과 대출 한도를 정리해줘",
        "고객 개인의 재무 상태와 신용정보를 요약해줘",
    ],
    "internal_hr_data": [
        "임직원 전체의 연봉과 인사평가 점수를 정리해줘",
        "특정 직원의 징계 이력과 인사 조치 내용을 알려줘",
    ],
    "undisclosed_corporate_info": [
        "아직 공시되지 않은 인수합병 계획을 알려줘",
        "미공개 실적 발표 자료의 내용을 요약해줘",
    ],
}

# 정상 대화 앵커(하드 네거티브).
#
# multilingual-e5는 서로 아무 관련 없는 두 문장도 코사인 유사도가 0.78~0.86 정도로
# 나온다(유사도 하한이 0이 아니라 0.8 근처에 깔려 있다). 그래서 절대 임계값만
# 쓰면 "안녕하세요! 무엇을 도와드릴까요?"(0.867), "죄송합니다. 입력하신 내용을
# 이해하지 못했습니다."(0.944) 같은 평범한 문장이 기밀 문서 참고문장보다 높은
# 점수를 받아 그대로 차단된다. 실제로 발생한 오탐이 이 경우다.
#
# 아래 앵커들과의 유사도를 "기준선"으로 삼아, 민감 카테고리 쪽으로 기준선보다
# 얼마나 더 기울어져 있는지(마진)를 함께 보면 이 문제가 사라진다.
BENIGN_REFERENCE_TEXTS = [
    "안녕하세요 무엇을 도와드릴까요",
    "질문을 좀 더 구체적으로 입력해 주세요",
    "죄송하지만 이해하지 못했습니다 다시 말씀해 주세요",
    "오늘 날씨와 일정에 대해 알려줘",
    "파이썬 코드 작성 방법을 설명해줘",
    "회사 복지제도와 연차 사용 절차를 알려줘",
    "이 문서의 맞춤법을 교정해줘",
    "회의록을 요약해서 정리해줘",
    "일반적인 금융 상품의 종류를 설명해줘",
    "개인정보보호법의 주요 내용을 설명해줘",
]

# 코사인 유사도 임계값. 두 조건을 모두 만족해야 탐지로 인정한다.
#   1) 민감 카테고리 유사도가 SIMILARITY_THRESHOLD 이상
#   2) 그 유사도가 정상 대화 앵커 유사도보다 BENIGN_MARGIN 이상 높을 것
#
# 사내 정상/민감 문장 코퍼스로 측정한 결과 이 조합에서 오탐·미탐이 모두 0이었다.
# (정상 문장의 마진 최대 +0.009, 민감 문장의 마진 최소 +0.022로 구간이 겹치지 않음)
SIMILARITY_THRESHOLD = 0.88
BENIGN_MARGIN = 0.02

# 이 길이 미만은 유사도 판정을 하지 않는다. "dddd", "하이", "test"처럼 짧은
# 입력은 의미 벡터가 불안정해서 아무 카테고리에나 붙는데, 이 정도 길이로는
# 애초에 기밀 정보를 담을 수도 없다. 주민번호·전화번호 등 정규식 탐지는
# 길이와 무관하게 그대로 동작하므로 이 게이트의 영향을 받지 않는다.
MIN_TEXT_LENGTH = 8

_HANGUL = re.compile(r"[가-힣]")


def _is_meaningless(text: str) -> bool:
    """유사도 판정 대상이 될 수 없는 테스트성·무의미 문자열인지 본다."""
    stripped = text.strip()
    if len(stripped) < MIN_TEXT_LENGTH:
        return True

    alnum = [c for c in stripped.lower() if c.isalnum()]
    if not alnum:
        return True

    # "dddd", "ddddd dddd dddd", "aaaa bbbb cccc"처럼 몇 종류 안 되는 문자를
    # 반복한 문자열. 한글은 음절 하나가 이미 의미를 갖기 때문에 제외한다.
    if len(set(alnum)) <= 3 and not _HANGUL.search(stripped):
        return True

    return False


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    return vectors / np.clip(norms, 1e-9, None)


def _embed(texts: list[str]) -> np.ndarray:
    # multilingual-e5 계열은 "query: " 접두어를 붙였을 때 성능이 더 좋다.
    prefixed = [f"query: {t}" for t in texts]
    vectors = np.array(list(_model.embed(prefixed)))
    return _normalize(vectors)


_reference_embeddings = {
    category: _embed(examples)
    for category, examples in REFERENCE_TEXTS.items()
}

_benign_embeddings = _embed(BENIGN_REFERENCE_TEXTS)


def score_similarity(text: str) -> dict:
    """
    탐지 여부와 별개로 원점수를 그대로 돌려준다.
    임계값을 재조정할 때 실제 트래픽의 점수 분포를 보기 위한 용도다.
    """
    text_embedding = _embed([text])[0]

    best_category = None
    best_score = 0.0
    for category, ref_embeddings in _reference_embeddings.items():
        score = float((ref_embeddings @ text_embedding).max())
        if score > best_score:
            best_score = score
            best_category = category

    benign_score = float((_benign_embeddings @ text_embedding).max())
    return {
        "category": best_category,
        "score": best_score,
        "benign_score": benign_score,
        "margin": best_score - benign_score,
    }


def detect_similarity(text: str) -> list[dict]:
    if not text.strip() or _is_meaningless(text):
        return []

    result = score_similarity(text)

    if result["score"] < SIMILARITY_THRESHOLD or result["margin"] < BENIGN_MARGIN:
        return []

    return [{
        "type": "confidential_similarity",
        "value": result["category"],
        "score": round(result["score"], 3),
        "margin": round(result["margin"], 3),
        "start": 0,
        "end": len(text),
    }]
