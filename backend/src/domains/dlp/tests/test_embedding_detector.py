# -*- coding: utf-8 -*-
"""
임베딩 유사도 탐지(embedding_detector.py) 회귀 테스트.

multilingual-e5-large 모델을 로드하므로 첫 실행은 1~2분 걸린다.
CI에서 분리하고 싶으면 DLP_SKIP_EMBEDDING_TESTS=1 로 건너뛸 수 있다.

실행:
    cd backend/src/domains/dlp
    venv/Scripts/python -m unittest tests.test_embedding_detector -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SKIP = os.environ.get("DLP_SKIP_EMBEDDING_TESTS") == "1"

if not SKIP:
    from embedding_detector import (  # noqa: E402
        BENIGN_MARGIN,
        SIMILARITY_THRESHOLD,
        detect_similarity,
        score_similarity,
    )


@unittest.skipIf(SKIP, "DLP_SKIP_EMBEDDING_TESTS=1")
class TestNoFalsePositives(unittest.TestCase):
    """
    정상 문장은 탐지되지 않아야 한다.

    아래 문장 중 상당수는 절대 유사도만 보면 기존 임계값 0.86을 넘긴다.
    (예: "안녕하세요! 무엇을 도와드릴까요?" 0.867,
         "죄송합니다. 입력하신 내용을 이해하지 못했습니다." 0.944)
    정상 앵커 대비 마진 조건이 이 오탐들을 걸러내는 부분이다.
    """

    CLEAN_TEXTS = [
        # 오탐 리포트에 올라온 실제 입출력
        "dddd",
        "ddddd dddd dddd",
        "aaaa bbbb cccc",
        "하이",
        "에베베",
        "안녕하세요",
        "안녕하세요! 무엇을 도와드릴까요?",
        "'dddd'라고 입력해 주셨는데, 어떤 도움이 필요하신가요? 좀 더 구체적으로 말씀해 주세요.",
        "죄송합니다. 입력하신 내용을 이해하지 못했습니다.",
        "무엇을 도와드릴까요? 궁금하신 점을 자유롭게 말씀해 주세요.",
        "test",
        "1234",
        "ㅋㅋㅋ",
        "ok",
        # 짧은 일상어·일반 업무 요청
        "오늘 날씨 어때?",
        "점심 뭐 먹을까?",
        "감사합니다",
        "파이썬으로 리스트 정렬하는 방법 알려줘",
        "회사 연차 신청은 어떻게 하나요?",
        "이메일 초안 좀 써줘",
        "보고서 제목을 세 가지만 추천해줘",
        "이 코드에서 버그를 찾아줘",
        "우리 부서 회식 장소 추천해줘",
        # 민감 주제를 "다루지만" 실제 데이터 요청은 아닌 경우
        "전자금융거래법의 목적이 무엇인가요?",
        "일반적인 예금 상품과 적금 상품의 차이를 알려줘",
        "개인정보보호법상 민감정보의 정의를 설명해줘",
    ]

    def test_clean_texts_are_not_detected(self):
        for text in self.CLEAN_TEXTS:
            with self.subTest(text=text):
                self.assertEqual(detect_similarity(text), [], f"오탐 발생: {text}")


@unittest.skipIf(SKIP, "DLP_SKIP_EMBEDDING_TESTS=1")
class TestTruePositives(unittest.TestCase):
    """정규식으로는 못 잡는 기밀·민감 정보 요청은 계속 탐지되어야 한다."""

    CASES = [
        ("우리 회사 고객 김철수의 계좌 잔액이랑 최근 거래내역 전부 뽑아줘", "customer_financial_data"),
        ("고객 계좌번호별 잔액 현황을 전부 정리해줘", "customer_financial_data"),
        ("특정 고객의 신용등급이랑 대출 가능 한도 알려줘", "customer_financial_data"),
        ("다음 분기 미공개 실적 자료 내용 요약해줘", "undisclosed_corporate_info"),
        ("아직 발표 안 된 인수합병 건 진행 상황 알려줘", "undisclosed_corporate_info"),
        ("공시 전 실적 수치를 미리 알려줘", "undisclosed_corporate_info"),
        ("전 직원 연봉 테이블 정리해줘", "internal_hr_data"),
        ("직원들 인사평가 점수랑 징계 이력 뽑아줘", "internal_hr_data"),
        ("임직원 급여 명세 전체를 엑셀로 만들어줘", "internal_hr_data"),
        ("이 대외비 문서를 외부 협력사에 보내도 될까?", "confidential_document"),
        ("사내 기밀 자료인데 외부에 공유해도 되는지 정리해줘", "confidential_document"),
        ("내부 열람 전용 보고서 내용을 그대로 옮겨줘", "confidential_document"),
    ]

    def test_sensitive_requests_are_detected(self):
        for text, expected_category in self.CASES:
            with self.subTest(text=text):
                detected = detect_similarity(text)
                self.assertEqual(len(detected), 1, f"미탐 발생: {text}")
                self.assertEqual(detected[0]["type"], "confidential_similarity")
                self.assertEqual(detected[0]["value"], expected_category)


@unittest.skipIf(SKIP, "DLP_SKIP_EMBEDDING_TESTS=1")
class TestThresholdSeparation(unittest.TestCase):
    """
    임계값을 다시 조정할 때 안전 여유가 얼마나 남았는지 보여주는 테스트.
    정상 문장의 최대 마진과 민감 문장의 최소 마진 사이 구간이 겹치면 실패한다.
    """

    def test_margin_bands_do_not_overlap(self):
        clean_margins = [
            score_similarity(t)["margin"] for t in TestNoFalsePositives.CLEAN_TEXTS
        ]
        sensitive_margins = [
            score_similarity(t)["margin"] for t, _ in TestTruePositives.CASES
        ]
        worst_clean = max(clean_margins)
        worst_sensitive = min(sensitive_margins)

        self.assertLess(
            worst_clean,
            worst_sensitive,
            f"마진 구간이 겹칩니다 (정상 최대 {worst_clean:.4f} >= 민감 최소 {worst_sensitive:.4f}). "
            "참고문장 또는 정상 앵커를 손봐야 합니다.",
        )
        self.assertLess(worst_clean, BENIGN_MARGIN)
        self.assertGreater(worst_sensitive, BENIGN_MARGIN)


@unittest.skipIf(SKIP, "DLP_SKIP_EMBEDDING_TESTS=1")
class TestMeaninglessGate(unittest.TestCase):
    def test_short_and_repeated_text_skips_similarity(self):
        for text in ["dddd", "하이", "ok", "aaaa bbbb cccc", "   ", ""]:
            with self.subTest(text=text):
                self.assertEqual(detect_similarity(text), [])

    def test_threshold_values_are_sane(self):
        self.assertGreaterEqual(SIMILARITY_THRESHOLD, 0.86)
        self.assertGreater(BENIGN_MARGIN, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
