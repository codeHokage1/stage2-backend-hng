const express = require('express');
require("dotenv").config();

const apiRouter = require('./routes/apiRouter');
const dbPool = require('./config/dbConfig');

const app = express();

app.use(express.json());

app.use("/", apiRouter)


const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});