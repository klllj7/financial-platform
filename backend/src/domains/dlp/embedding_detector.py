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

# 코사인 유사도 임계값. 실제 사용 데이터가 쌓이면 조정이 필요할 수 있다.
SIMILARITY_THRESHOLD = 0.86


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


def detect_similarity(text: str) -> list[dict]:
    if not text.strip():
        return []

    text_embedding = _embed([text])[0]

    best_category = None
    best_score = 0.0
    for category, ref_embeddings in _reference_embeddings.items():
        score = float((ref_embeddings @ text_embedding).max())
        if score > best_score:
            best_score = score
            best_category = category

    if best_score >= SIMILARITY_THRESHOLD:
        return [{
            "type": "confidential_similarity",
            "value": best_category,
            "score": round(best_score, 3),
            "start": 0,
            "end": len(text),
        }]
    return []
