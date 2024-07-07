const express = require('express');
require("dotenv").config();

const apiRouter = require('./routes/apiRouter');
const dbPool = require('./config/dbConfig');

const app = express();

app.use(express.json());

app.use("/", apiRouter)

module.exports = app;