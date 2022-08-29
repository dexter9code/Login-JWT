const express = require("express");
const app = express();
const dotenv = require("dotenv");
const rateLimte = require("express-rate-limit");

const globalHandler = require("./controller/ErrorController");
const userRouter = require(`./routes/userRoute`);
const AppError = require("./utils/ErrorHandler");

dotenv.config({ path: `${__dirname}/config` });

const limter = rateLimte({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: `Too many login attempts found try again after sometime`,
});

//middlewares
app.use(express.json());

//Routes
app.use(`/api/v1/users`, limter, userRouter);
app.all("*", (req, res, next) =>
  next(new AppError(`Cannot find the route with ${req.originalUrl}`, 404))
);

app.use(globalHandler);

module.exports = app;
