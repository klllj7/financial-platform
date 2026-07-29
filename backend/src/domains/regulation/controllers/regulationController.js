const RegulationDocument = require("../models/regulationDocument");
const RegulationClause = require("../models/regulationClause");
const { Op } = require("sequelize");

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
        const { search } = req.query;
        const where = { doc_id: req.params.id };

        if (search) {
            where[Op.or] = [
                { clause_no: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }

        const documents = await RegulationClause.findAll({ where });
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

// POST /api/regulations/documents/:id/clauses
exports.createClause = async (req, res) => {
    try {
        const { clause_no, title, description } = req.body;

        const clause = await RegulationClause.create({
            doc_id: req.params.id,
            clause_no,
            title,
            description,
            file_name: req.file ? req.file.originalname : null,
            file_path: req.file ? `/uploads/regulations/${req.file.filename}` : null,
            file_type: req.file ? req.file.mimetype : null,
        });

        res.json({
            success: true,
            data: clause,
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

// POST /api/regulations/documents
exports.createDocument = async (req, res) => {
    try {
        const documents = await RegulationDocument.create({doc_name: req.body.doc_name});
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
