const User = require("../model/userModel");
const _ = require("lodash");
const CatchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/ErrorHandler");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const creaetToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXP,
  });
};

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
    token,
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
    token,
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

exports.updatePassword = CatchAsync(async (req, res, next) => {
  const id = req.user.id;
  const user = await User.findById(id).select(`+password`);

  if (!user.correctPassword(req.body.currentPassword, user.password))
    return next(new AppError(`Password doesnot Match`, 401));

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

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
    token,
    data: { user },
  });
});

///// *********** Route protection *************** //////

exports.protect = CatchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token)
    return next(new AppError(`Not logged in please login to get acess`, 401));

  const decode = await promisify(jwt.verify)(token, process.env.JWT_KEY);

  const currentUser = await User.findById(decode.id);
  if (!currentUser) return next(new AppError(`User doesnot exists`, 401));

  req.user = currentUser;
  next();
});

exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError(`You are allowed to perform this action`, 403));
    next();
  };
};
