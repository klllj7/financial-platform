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

// PUT /api/policies/:id
exports.updatePolicy = async (req, res) => {
    const transaction = await PolicyInfo.sequelize.transaction();

    try {
        const { id } = req.params;
        const { rule_content, active_yn } = req.body;

        // 같은 정책이 동시에 수정되는 상황을 줄이기 위해 트랜잭션 안에서 대상 정책 조회
        const policy = await PolicyInfo.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!policy) {
            await transaction.rollback();

            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }

        // 정책 내용이 없거나 공백 문자열이면 수정 요청을 거절한다.
        const isEmptyRuleContent = 
            rule_content === undefined ||
            rule_content === null ||
            (typeof rule_content === "string" && !rule_content.trim());

        if (isEmptyRuleContent) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                data: null,
                error: "정책 내용을 입력해주세요.",
            });
        }

        const currentVersion = Number(policy.version) || 1;
        const isPending = policy.approval_status === "pending";

        // 이미 승인 대기 중인 정책을 다시 수정할 경우에는 같은 검토 요청을 보완하는 것으로 보고 버전을 유지
        const nextVersion = isPending ? currentVersion : currentVersion + 1;

        // 새 버전이 생성될 때만 이전 정책 내용을 이력으로 저장
        if (!isPending) {
            await PolicyHistory.create(
                { 
                    policy_id: policy.id, 
                    version: currentVersion, 
                    rule_snapshot: policy.rule_content, 
                }, 
                { transaction }
            );
        }
        
        // 정책 내용이 수정되면 관리자의 재검토가 필요하므로 승인 상태를 다시 승인대기(pending)로 변경
        await policy.update(
            { 
                rule_content,
                version: nextVersion, 
                active_yn: typeof active_yn === "boolean" ? active_yn : policy.active_yn,
                approval_status: "pending",
                reject_reason: null,
                reject_detail: null,
                revision_request: null,
                rejected_by: null,
                rejected_at: null,
            },
            { transaction }
        );

        await transaction.commit();

        return res.json({
            success: true,
            data: policy,
            error: null
        });
    } catch (error) {
        await transaction.rollback();

        console.error("정책 수정 실패: ", error);

        return res.status(500).json({
            success: false,
            data: null,
            error: "정책 수정 중 오류가 발생했습니다.",
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