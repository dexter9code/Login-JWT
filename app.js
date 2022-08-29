const express = require("express");
const app = express();
const dotenv = require("dotenv");

dotenv.config({ path: `${__dirname}/config` });

//middlewares
app.use(express.json());

module.exports = app;