const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authController = require("../controller/authController");

router.route(`/`).get(userController.getAllUser);

router.route(`/signup`).post(authController.singup);
router.route(`/signin`).post(authController.singin);

router.route(`/forgotPassword`).post(authController.forgotPassword);
router.route(`/resetPassword/:token`).patch(authController.resetPassword);

module.exports = router;
