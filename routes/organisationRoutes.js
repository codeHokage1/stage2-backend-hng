const router = require("express").Router();
const organisationController = require("../controllers/organisationsController");
const { verifyToken } = require("../middlewares/auth");

router
    .get("/", verifyToken, organisationController.getOrganisations)
    .get("/:orgId", verifyToken, organisationController.getOneOrganisation)
    .post("/", verifyToken, organisationController.createOrganisation)
    .post("/:orgId/users", verifyToken, organisationController.addMember)

module.exports = router;
