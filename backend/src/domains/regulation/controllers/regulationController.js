const fs = require("fs");
const path = require("path");
const RegulationDocument = require("../models/regulationDocument");
const RegulationClause = require("../models/regulationClause");
const PolicyClauseMap = require("../models/policyClauseMap");
const { Op } = require("sequelize");

// file_path("/uploads/regulations/파일명")를 실제 로컬 디스크 경로로 바꾼다.
const resolveUploadedFilePath = (filePath) =>
    path.join(__dirname, "../../../../uploads", filePath.replace(/^\/uploads\//, ""));

// 옛 파일을 지울 때 디스크에 이미 없어도(ENOENT) 실패로 취급하지 않는다.
const removeUploadedFileIfExists = (filePath) => {
    if (!filePath) return;
    fs.unlink(resolveUploadedFilePath(filePath), (error) => {
        if (error && error.code !== "ENOENT") {
            console.error(`첨부파일 삭제 실패 (path=${filePath}):`, error.message);
        }
    });
};

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

        if (!clause_no?.trim() || !title?.trim() || !description?.trim()) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "조항 번호, 제목, 내용을 모두 입력해주세요."
            });
        }

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

// PUT /api/regulations/clauses/:clauseId
exports.updateClause = async (req, res) => {
    try {
        const { clause_no, title, description } = req.body;

        if (!clause_no?.trim() || !title?.trim() || !description?.trim()) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "조항 번호, 제목, 내용을 모두 입력해주세요."
            });
        }

        const clause = await RegulationClause.findByPk(req.params.clauseId);

        if (!clause) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "해당 조항을 찾을 수 없습니다."
            });
        }

        // 새 파일을 올렸을 때만 첨부파일을 교체하고, 옛 파일은 디스크에서 지운다.
        // 파일을 안 올렸으면 기존 첨부파일을 그대로 둔다.
        const fileFields = req.file
            ? {
                file_name: req.file.originalname,
                file_path: `/uploads/regulations/${req.file.filename}`,
                file_type: req.file.mimetype,
            }
            : {};

        if (req.file && clause.file_path) {
            removeUploadedFileIfExists(clause.file_path);
        }

        await clause.update({ clause_no, title, description, ...fileFields });

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

// DELETE /api/regulations/clauses/:clauseId
exports.deleteClause = async (req, res) => {
    try {
        const clause = await RegulationClause.findByPk(req.params.clauseId);

        if (!clause) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "해당 조항을 찾을 수 없습니다."
            });
        }

        // 이 조항을 가리키던 정책 매핑이 고아 참조로 남지 않도록 같이 지운다.
        await PolicyClauseMap.destroy({ where: { clause_id: clause.id } });

        removeUploadedFileIfExists(clause.file_path);

        await clause.destroy();

        res.json({
            success: true,
            data: { id: Number(req.params.clauseId) },
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
