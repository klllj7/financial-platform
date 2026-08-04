# -*- coding: utf-8 -*-
"""
/gateway/chat 의 적재 동작 회귀 테스트.

핵심은 "한 번의 대화 요청에 usage_log가 정확히 1건만 쌓이는가"다.
AI 응답 검사가 usage_log를 하나 더 만들면 사용 이력 통계가 2배로 부풀려진다.

SQLite 인메모리 DB를 붙여서 실제 Postgres 없이 돌린다.
임베딩 모델을 로드하므로 첫 실행은 1~2분 걸린다.

실행:
    cd backend/src/domains/dlp
    venv/Scripts/python -m unittest tests.test_gateway_logging -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SKIP = os.environ.get("DLP_SKIP_EMBEDDING_TESTS") == "1"

if not SKIP:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    import main
    from models import ActionHistory, Base, EventLog, UsageLog

CLEAN = "오늘 회의록을 세 줄로 요약해줘"
PII = "제 주민번호는 901231-1234567 입니다"
SENSITIVE_REPLY = "고객 계좌 잔액이랑 최근 거래내역 전부 정리해서 알려드릴게요"


@unittest.skipIf(SKIP, "DLP_SKIP_EMBEDDING_TESTS=1")
class GatewayLoggingTestCase(unittest.TestCase):
    def setUp(self):
        # 인메모리 DB는 연결이 끊기면 사라져서 StaticPool로 커넥션을 고정한다.
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)

        self._original_session = main.SessionLocal
        main.SessionLocal = self.Session

    def tearDown(self):
        main.SessionLocal = self._original_session
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    # --- 헬퍼 -------------------------------------------------------------
    def inspect(self, prompt, direction="input", usage_log_id=None, user_id=1):
        return main.gateway_chat(main.ChatRequest(
            prompt=prompt,
            user_id=user_id,
            direction=direction,
            usage_log_id=usage_log_id,
        ))

    def rows(self, model):
        session = self.Session()
        try:
            return session.query(model).all()
        finally:
            session.close()

    def count(self, model):
        return len(self.rows(model))


class TestUsageLogIsNotDuplicated(GatewayLoggingTestCase):
    def test_clean_exchange_creates_exactly_one_usage_log(self):
        result = self.inspect(CLEAN)
        self.inspect("네, 요약해 드리겠습니다.", direction="output",
                     usage_log_id=result["usage_log_id"])

        self.assertEqual(self.count(UsageLog), 1)
        self.assertEqual(self.count(EventLog), 0)

    def test_blocked_ai_response_does_not_create_second_usage_log(self):
        """이번 버그의 본체: 입력은 깨끗한데 AI 응답이 걸린 경우."""
        result = self.inspect(CLEAN)
        self.assertEqual(result["action_status"], "allowed")

        output = self.inspect(SENSITIVE_REPLY, direction="output",
                              usage_log_id=result["usage_log_id"])
        self.assertEqual(output["action_status"], "blocked")

        # usage_log는 사용자가 보낸 요청 1건뿐이어야 한다.
        self.assertEqual(self.count(UsageLog), 1)
        usage_log = self.rows(UsageLog)[0]
        self.assertEqual(usage_log.description, CLEAN)
        self.assertNotIn("고객 계좌", usage_log.description)

        # 이벤트는 같은 usage_log에 출력 방향으로 달린다.
        events = self.rows(EventLog)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].direction, "output")
        self.assertEqual(events[0].event_id, usage_log.id)
        self.assertEqual(events[0].detection_type, "confidential_similarity")

    def test_output_event_keeps_its_own_text(self):
        """출력 이벤트가 usage_log의 프롬프트를 자기 본문인 척 보여주면 안 된다."""
        result = self.inspect(CLEAN)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        event = self.rows(EventLog)[0]
        self.assertEqual(event.description, SENSITIVE_REPLY)
        # confidential_similarity는 문장 전체가 탐지 구간이라 마스킹본이 별표만 남는다.
        # 그래서 원문까지 있어야 담당자가 오탐 여부를 판단할 수 있다.
        self.assertIsNotNone(event.masked_description)
        self.assertNotIn("고객 계좌", event.masked_description)

    def test_input_event_does_not_duplicate_body_into_event_log(self):
        self.inspect(PII)
        event = self.rows(EventLog)[0]
        self.assertEqual(event.direction, "input")
        # 입력 본문은 usage_log에 이미 있으므로 event_log에는 중복 저장하지 않는다.
        self.assertIsNone(event.description)
        self.assertIsNone(event.masked_description)

    def test_both_directions_detected_share_one_usage_log(self):
        result = self.inspect(PII)
        self.assertEqual(result["action_status"], "blocked")
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        self.assertEqual(self.count(UsageLog), 1)
        events = self.rows(EventLog)
        self.assertEqual(len(events), 2)
        self.assertEqual({e.direction for e in events}, {"input", "output"})
        self.assertEqual({e.event_id for e in events}, {result["usage_log_id"]})


class TestOutputWithoutUsageLogId(GatewayLoggingTestCase):
    """입력 검사 때 DLP가 죽어 있어서 usage_log_id를 못 받은 경우."""

    def test_still_blocks_but_creates_no_usage_log(self):
        output = self.inspect(SENSITIVE_REPLY, direction="output", usage_log_id=None)

        # 보호는 그대로 동작해야 한다.
        self.assertEqual(output["action_status"], "blocked")
        # 로그를 못 남겼다는 사실은 응답으로 알려준다.
        self.assertFalse(output["logged"])
        # AI 응답이 사용자의 사용 이력으로 둔갑하면 안 된다.
        self.assertEqual(self.count(UsageLog), 0)
        self.assertEqual(self.count(EventLog), 0)


class TestActionHistory(GatewayLoggingTestCase):
    def test_auto_actions_are_tagged_with_direction(self):
        result = self.inspect(PII)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        actions = self.rows(ActionHistory)
        self.assertEqual(len(actions), 2)
        self.assertEqual({a.direction for a in actions}, {"input", "output"})

    def test_no_action_history_when_nothing_detected(self):
        self.inspect(CLEAN)
        self.assertEqual(self.count(ActionHistory), 0)


class TestEventsEndpoint(GatewayLoggingTestCase):
    def test_rows_are_uniquely_identifiable(self):
        result = self.inspect(PII)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        events = main.list_events()
        self.assertEqual(len(events), 2)
        # event_id는 둘 다 같은 usage_log를 가리키므로 목록 key로 쓸 수 없다.
        self.assertEqual(len({e["event_id"] for e in events}), 1)
        self.assertEqual(len({e["id"] for e in events}), 2)
        self.assertEqual({e["direction"] for e in events}, {"input", "output"})

    def test_auto_actions_do_not_leak_across_directions(self):
        result = self.inspect(PII)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        for event in main.list_events():
            with self.subTest(direction=event["direction"]):
                self.assertEqual(len(event["actions"]), 1)

    def test_manual_action_shows_on_every_direction(self):
        """담당자의 수동 조치는 요청 전체에 대한 판단이라 양쪽에 다 보여야 한다."""
        result = self.inspect(PII)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        main.create_action(result["usage_log_id"], main.ActionRequest(
            actor_user_id=1,
            action_type=main.ActionType.reviewed,
            action_reason="오탐 확인",
        ))

        for event in main.list_events():
            with self.subTest(direction=event["direction"]):
                types = [a["action_type"] for a in event["actions"]]
                self.assertIn("reviewed", types)
                self.assertEqual(len(types), 2)

    def test_output_event_body_is_its_own(self):
        result = self.inspect(CLEAN)
        self.inspect(SENSITIVE_REPLY, direction="output",
                     usage_log_id=result["usage_log_id"])

        event = main.list_events()[0]
        self.assertEqual(event["direction"], "output")
        # 사용자 프롬프트(CLEAN)가 아니라 AI 응답이 실려야 한다.
        self.assertEqual(event["description"], SENSITIVE_REPLY)
        self.assertNotIn("회의록", event["masked_description"] or "")


if __name__ == "__main__":
    unittest.main(verbosity=2)
