const exporess = require("express")
const router = exporess.Router();
const regulationController = require("../controllers/regulationController");

router.get("/documents", regulationController.getDocuments);
router.get("/documents/:id/clauses", regulationController.getClauses);

module.exports = router;