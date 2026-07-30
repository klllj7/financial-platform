// DLP 백엔드(detector.py/embedding_detector.py)가 내려주는 탐지 유형 코드를
// 한국어 라벨로 변환한다. 위험 이벤트 관리 화면 등에서 영문 코드가 그대로
// 보여서 가독성이 떨어진다는 피드백을 반영.
export const DETECTION_TYPE_LABELS = {
  resident_number: "주민등록번호",
  phone_number: "휴대폰번호",
  account_number: "계좌번호",
  card_number: "카드번호",
  email: "이메일",
  prompt_injection: "프롬프트 인젝션",
  confidential_similarity: "기밀·민감정보 유사",
};

// detection_type은 "resident_number,phone_number"처럼 쉼표로 이어진 문자열이라
// 각 코드를 한국어 라벨로 바꾼 뒤 다시 이어붙인다. 매핑에 없는 값은 원문 그대로 둔다.
export const formatDetectionType = (detectionType) =>
  (detectionType ?? "")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean)
    .map((type) => DETECTION_TYPE_LABELS[type] ?? type)
    .join(" · ");
