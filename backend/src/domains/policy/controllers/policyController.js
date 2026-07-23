const PolicyInfo = require("../models/policyInfo"); // PolicyInfo 모델 불러오기
const PolicyHistory = require("../models/policyHistory"); // PolicyHistory 모델 불러오기
//Post /api/policies
exports.createPolicy = async (req, res) => {
    try{
        const { department_id, name, rule_content} =req.body;
        const policy = await PolicyInfo.create({
            department_id,
            name,
            rule_content
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
        res.json({
            success: true,
            data: policies,
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
        const { rule_content } = req.body;

        const policy = await PolicyInfo.findByPk(id);
        if (!policy) {
            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }

        await PolicyHistory.create({ policy_id: id, version: policy.version, rule_snapshot: policy.rule_content });
        await policy.update({ version: policy.version + 1, rule_content });

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
        const { reject_reason } = req.body;
        const policy = await PolicyInfo.findByPk(id);
        if (!policy) {
            return res.status(404).json({ success: false, data: null, error: "정책을 찾을 수 없습니다." });
        }
        await policy.update({ approval_status: "rejected", active_yn: false, reject_reason });
        res.json({ success: true, data: policy, error: null });
    } catch (error) {
        res.status(500).json({ success: false, data: null, error: error.message });
    }
};