const PolicyInfo = require("../models/policyInfo"); // PolicyInfo 모델 불러오기
const PolicyHistory = require("../models/policyHistory"); // PolicyHistory 모델 불러오기
const Department = require("../../auth/department.model"); // 부서명 조회용 (A 담당자 모델, 읽기 전용으로만 사용)
//Post /api/policies
exports.createPolicy = async (req, res) => {
    try{
        const { department_id, name, rule_content, requested_by } = req.body;
        const policy = await PolicyInfo.create({
            department_id,
            name,
            rule_content,
            requested_by
        });
        res.json({
            success: true,
            data: policy,
            error: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};

// GET /api/policies
exports.getPolicies = async (req, res) => {
    try {
        const policies = await PolicyInfo.findAll();

        // department_id -> 부서명 매핑 (도메인 간 연관관계 없이 간단히 조회해서 붙여준다)
        const departments = await Department.findAll();
        const departmentNameById = {};
        departments.forEach((department) => {
            departmentNameById[department.id] = department.name;
        });

        const policiesWithDepartment = policies.map((policy) => {
            const plain = policy.toJSON();
            return {
                ...plain,
                department_name: departmentNameById[plain.department_id] || null,
            };
        });

        res.json({
            success: true,
            data: policiesWithDepartment,
            error: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};

//put /api/policies/:id
exports.updatePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { rule_content, active_yn } = req.body;

        const policy = await PolicyInfo.findByPk(id);
        if (!policy) {
            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }

        await PolicyHistory.create({ policy_id: id, version: policy.version, rule_snapshot: policy.rule_content });
        await policy.update({ version: policy.version + 1, rule_content, active_yn });

        res.json({
            success: true,
            data: policy,
            error: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};

// PATCH /api/policies/:id/approve
exports.approvePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await PolicyInfo.findByPk(id);
    if (!policy) {
      return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
    }
    await policy.update({ approval_status: "approved", active_yn: true });
    res.json({ success: true, data: policy, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

// PATCH /api/policies/:id/reject
exports.rejectPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { reject_reason, reject_detail, revision_request, rejected_by } = req.body;
        const policy = await PolicyInfo.findByPk(id);
        if (!policy) {
            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }
        await policy.update({
            approval_status: "rejected",
            active_yn: false,
            reject_reason,
            reject_detail,
            revision_request,
            rejected_by,
            rejected_at: new Date(),
        });
        res.json({ success: true, data: policy, error: null });
    } catch (error) {
        res.status(500).json({ success: false, data: null, error: error.message });
    }
};

// PATCH /api/policies/:id/active
// 규칙 내용/버전은 건드리지 않고 활성화 여부만 켜고 끈다.
exports.setPolicyActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { active_yn } = req.body;
        const policy = await PolicyInfo.findByPk(id);
        if (!policy) {
            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }
        await policy.update({ active_yn });
        res.json({ success: true, data: policy, error: null });
    } catch (error) {
        res.status(500).json({ success: false, data: null, error: error.message });
    }
};