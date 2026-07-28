const RegulationDocument = require("../models/regulationDocument");
const RegulationClause = require("../models/regulationClause");
const PolicyClauseMap = require("../models/policyClauseMap");
const PolicyInfo = require("../../policy/models/policyInfo");

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