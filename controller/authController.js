const User = require("../model/userModel");
const _ = require("lodash");
const CatchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/ErrorHandler");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const creaetToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXP,
  });
};

// const sendToken = (user, statusCode, res) => {
//   const token = creaetToken(user._id, user.email);

//   const cookieOptions = {
//     expiresIn: new Date.now(
//       Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: false,
//   };

//   res.cookie("jwt", token, cookieOptions);
// };

exports.singup = CatchAsync(async (req, res, next) => {
  const user = await User.create(
    _.pick(req.body, ["name", "email", "password", "confirmPassword"])
  );

  const token = creaetToken(user._id, user.email);

  const cookieOptions = {
    expiresIn: new Date.now(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };

  res.cookie("token", token, cookieOptions);

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

  const user = await User.findOne({ email }).select(`+password -__v +active`);

  if (!user.active) return next(new AppError(`User is deleted`));

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(`Invalid Email or Password`, 401));

  const token = creaetToken(user._id, user.email);

  const cookieOptions = {
    expiresIn: Date.now(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };

  res.cookie("token", token, cookieOptions);

  user.password = undefined;

  res.status(200).json({
    status: `Success`,
    data: { user },
  });
});

exports.forgotPassword = CatchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError(`No user found with ${email}`, 404));

  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    res.status(200).json({
      status: `Success`,
      message: `Please go /api/v1/users/resetPassword/${resetToken} only valid for 5 Minutes`,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(`Error`, 500));
  }
});

exports.resetPassword = CatchAsync(async (req, res, next) => {
  const token = req.params.token;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user)
    return next(new AppError(`Token is expired please get new one`, 400));

  (user.password = req.body.password),
    (user.confirmPassword = req.body.confirmPassword),
    (user.passwordResetToken = undefined);
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    status: `Success`,
    message: `Password has been changed please login with your new password`,
  });
});
