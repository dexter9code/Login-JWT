const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, `Name Cannot be empty`],
    minLength: [3, `Name not match to the Expected Length`],
    trim: true,
  },
  email: {
    type: String,
    required: [true, `Email is requried`],
    unique: true,
    validate: {
      validator: function (el) {
        return el.includes("@");
      },
      message: `Please enter a valid Email Address`,
    },
  },
  password: {
    type: String,
    required: [true, `Password Cannot be empty`],
    minLength: [5, `Minimum Length is 5 Character`],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, `Password Cannot be empty`],
    minLength: [5, `Minimum Length is 5 Character`],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: `Password doesnot Match`,
    },
  },
  role: {
    type: String,
    enum: ["user", "admin", "sub-admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: { type: Boolean, default: true, select: false },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
