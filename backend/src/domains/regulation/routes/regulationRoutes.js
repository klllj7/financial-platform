const exporess = require("express")
const router = exporess.Router();
const regulationController = require("../controllers/regulationController");

router.get("/documents", regulationController.getDocuments);
router.get("/documents/:id/clauses", regulationController.getClauses);

router.post("/clauses/:id/mappings", regulationController.createMapping);
router.delete("/clauses/:id/mappings", regulationController.deleteMapping);
module.exports = router;