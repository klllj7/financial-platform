// [뼈대 단계] 실제 체크리스트 테이블이 아직 없어서
// 배관 확인용 placeholder 데이터만 반환한다.
// 다음 단계에서 이 함수 내부를 실제 DB 조회 또는
// 목데이터 143개 항목으로 채운다.

const getEvidenceChecklist = async () => {
    return {
        categoryMeta: [],
        naCategories: [],
        items: []
    };
};
module.exports = {
    getEvidenceChecklist
};