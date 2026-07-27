const evidenceService = require("./evidence.service");
const {success, fail} = require("../../../common/utils/response");

const getEvidenceChecklist = async (req, res) => {
    try{
        const data = await evidenceService.getEvidenceChecklist();
        return success(res, data, 200);
    } catch(error){
        return fail(
            res, 
            error.code || "EVIDENCE_CHECKLIST_FAILED",
            error.message || "증빙자료 조회에 실패했습니다",
            error.statusCode || 500
        );
    }
};

module.exports = {
    getEvidenceChecklist
};