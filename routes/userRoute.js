const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authController = require("../controller/authController");

router.route(`/`).get(authController.protect, userController.getAllUser);

router.route(`/signup`).post(authController.singup);
router.route(`/signin`).post(authController.singin);

router.route(`/forgotPassword`).post(authController.forgotPassword);
router.route(`/resetPassword/:token`).patch(authController.resetPassword);
router
  .route(`/updatePassword`)
  .patch(authController.protect, authController.updatePassword);

module.exports = router;
