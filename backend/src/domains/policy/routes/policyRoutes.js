const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");

// POST /api/policies
router.post("/", policyController.createPolicy);
// GET /api/policies
router.get("/", policyController.getPolicies);
//PUT /api/policies/:id
router.put("/:id", policyController.updatePolicy);
//Patch /api/policies/:id/approve
router.patch("/:id/approve", policyController.approvePolicy);
//Patch /api/policies/:id/reject
router.patch("/:id/reject", policyController.rejectPolicy);
module.exports = router;