const express = require("express");
const app = express();
const dotenv = require("dotenv");
const AppError = require("./utils/ErrorHandler");

dotenv.config({ path: `${__dirname}/config` });

//middlewares
app.use(express.json());

app.use(AppError);

module.exports = app;
