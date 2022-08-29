const express = require("express");
const app = express();
const dotenv = require("dotenv");

const globalHandler = require("./controller/ErrorController");
const userRouter = require(`./routes/userRoute`);
const AppError = require("./utils/ErrorHandler");

dotenv.config({ path: `${__dirname}/config` });

//middlewares
app.use(express.json());

//Routes
app.use(`/api/v1/users`, userRouter);
app.all("*", (req, res, next) =>
  next(new AppError(`Cannot find the route with ${req.originalUrl}`, 404))
);

app.use(globalHandler);

module.exports = app;
