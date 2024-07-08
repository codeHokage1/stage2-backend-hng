const express = require("express");
require("dotenv").config();

const apiRouter = require("./routes/apiRouter");
const dbPool = require("./config/dbConfig");

const app = express();

app.use(express.json());

app.use("/", apiRouter);
app.use("*", (req, res) => {
  return res.status(404).json({
    status: "error",
    error: "Route not found",
  });
});

module.exports = app;
