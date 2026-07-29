const exporess = require("express")
const router = exporess.Router();
const regulationController = require("../controllers/regulationController");
const upload = require("../../../common/middlewares/uploadMiddleware")

router.get("/documents", regulationController.getDocuments);
router.post("/documents", regulationController.createDocument);
router.post("/documents/:id/clauses", upload.single("file"),
regulationController.createClause);
router.get("/documents/:id/clauses", regulationController.getClauses);

module.exports = router;