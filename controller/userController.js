const User = require("../model/userModel");
const catchAsync = require("../utils/CatchAsync");

exports.getAllUser = catchAsync(async (req, res, next) => {
  const user = await User.find().select(`-__v`);

  res.status(200).json({
    status: `Success`,
    length: user.length,
    data: { user },
  });
});
