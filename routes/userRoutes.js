const router = require("express").Router();
const userController = require("../controllers/usersController");
const { verifyToken } = require("../middlewares/auth");

router
  .get("/", userController.getUsers)
  .get("/:userId", verifyToken, userController.getUser);

module.exports = router;
