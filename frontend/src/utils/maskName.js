/*
  이름 가운데 글자를 마스킹한다. 위험 이벤트 관리 화면처럼 이름 원문을
  노출하면 안 되는 화면에서 공용으로 쓴다.

  - 2글자: 마지막 글자만 마스킹 (김수 -> 김*)
  - 3글자 이상: 첫 글자와 마지막 글자만 남기고 가운데를 전부 마스킹
    (김서연 -> 김*연, 남궁민수 -> 남**수)
  - 1글자: 전부 마스킹 (아무 글자도 남기지 않음)
  - null/undefined/빈 문자열: "-" 반환
*/
export const maskName = (name) => {
  if (!name) return "-";

  const trimmed = name.trim();
  if (!trimmed) return "-";

  if (trimmed.length === 1) return "*";
  if (trimmed.length === 2) return `${trimmed[0]}*`;

  const middleMask = "*".repeat(trimmed.length - 2);
  return `${trimmed[0]}${middleMask}${trimmed[trimmed.length - 1]}`;
};
