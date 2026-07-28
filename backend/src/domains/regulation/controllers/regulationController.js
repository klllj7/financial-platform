const RegulationDocument = require("../models/regulationDocument");
const RegulationClause = require("../models/regulationClause");
const PolicyClauseMap = require("../models/policyClauseMap");
const PolicyInfo = require("../../policy/models/policyInfo");
const { success } = require("../../../common/utils/response");

// GET /api/regulations/documents
exports.getDocuments = async (req, res) => {
    try {
        const documents = await RegulationDocument.findAll();
        res.json({
            success: true,
            data: documents,
            error: null
        });
    }catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};

// GET /api/regulations/documents/:id/clauses
exports.getClauses = async (req, res) => {
    try {
        const documents = await RegulationClause.findAll({ where: { doc_id: req.params.id } });
        res.json({
            success: true,
            data: documents,
            error: null
        });
    }catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};
// POST /api/regulations/clauses/:id/mappings
exports.createMapping = async (req, res) => {
    try {
        const documents = await PolicyClauseMap.create({clause_id: req.params.id, policy_id: req.body.policy_id });
        res.json({
            success: true,
            data: documents,
            error: null
        });
            }catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};

// DELETE /api/regulations/clauses/:id/mappings
exports.deleteMapping = async (req, res) => {
    try {
        const documents = await PolicyClauseMap.destroy ({ where: {clause_id: req.params.id, policy_id: req.body.policy_id}});
        res.json({
            success: true,
            data: null,
            error: null
        });
    }catch(error) {
        res.status(500).json({
            success: false,
            data: null,
            error: error.message
        });
    }
};
