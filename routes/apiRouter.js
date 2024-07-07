const router = require("express").Router();
const authRouter = require("./authRoutes");
const userRouter = require("./userRoutes");
const organisationRouter = require("./organisationRoutes");

router
  .get("/", (req, res) => {
    res.send("Stage 2 HNG Backend Task - Farhan Sodiq");
  })
  .use("/auth", authRouter)
  .use("/api/users", userRouter)
  .use("/api/organisations", organisationRouter);

module.exports = router;
