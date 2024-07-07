const router = require("express").Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/usersController");

router
  .post("/register", userController.createUser)
  .post("/login", authController.login)

module.exports = router;
