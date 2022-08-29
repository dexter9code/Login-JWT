const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

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

// document Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  this.confirmPassword = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// query Middlware
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// instance method
userSchema.methods.correctPassword = async function (realPass, userPass) {
  return await bcrypt.compare(realPass, userPass);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 5 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
