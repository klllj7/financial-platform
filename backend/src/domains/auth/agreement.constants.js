// 회원가입 시 동의를 받는 약관 종류
const AGREEMENT_TYPES = Object.freeze({
  TERMS_OF_SERVICE: "TERMS_OF_SERVICE",
  PRIVACY_COLLECTION_USE: "PRIVACY_COLLECTION_USE",
});

// 사용자가 동의한 시점의 약관 버전을 저장하기 위한 값
// 약관 내용 변경 시 해당 버전 올려서 관리
const AGREEMENT_VERSIONS = Object.freeze({
  TERMS_OF_SERVICE: "1.0",
  PRIVACY_COLLECTION_USE: "1.0",
});

module.exports = {
  AGREEMENT_TYPES,
  AGREEMENT_VERSIONS,
};