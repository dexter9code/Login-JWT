const User = require("../model/userModel");
const _ = require("lodash");
const CatchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/ErrorHandler");

exports.singup = CatchAsync(async (req, res, next) => {
  const user = await User.create(
    _.pick(req.body, ["name", "email", "password", "confirmPassword"])
  );

  user.password = undefined;
  user.active = undefined;

  res.status(201).json({
    status: `Success`,
    data: { user },
  });
});

exports.singin = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError(`Email or password is not provided`, 400));

  const user = await User.findOne({ email }).select(`+password -__v`);

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(`Invalid Email or Password`, 401));

  user.password = undefined;

  res.status(200).json({
    status: `Success`,
    data: { user },
  });
});
