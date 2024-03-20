const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");

const authController = require("../controllers/auth");
const { isAuth } = require("../middlewares/is-auth");

const router = express.Router();

// POST: /auth/signup
router.post(
  "/signup",
  [
    // validate fullName
    body("fullName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Full name cannot be empty."),
    // validate email
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (val) => {
        const user = await User.findOne({ email: val });
        if (user) {
          return Promise.reject("E-mail address already exists!");
        }
      })
      .normalizeEmail(),
    // validate password
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password has at least 8 characters."),
    // validate phone number
    body("tel")
      .trim()
      .isEmpty()
      .withMessage("Phone number cannot be empty.")
      .custom((val) => {
        // Vietnamese phone number format
        const vnTel_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
        return vnTel_regex.test(val);
      })
      .withMessage("Please enter a valid phone number."),
  ],
  authController.signUp
);

// POST: /auth/login
router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Please enter a valid email."),
    body("password")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please enter password."),
  ],
  authController.login
);

// POST: /auth/logout
router.post("/logout", authController.logout);

// POST: /auth/check_token
router.post("/check_token", isAuth, authController.checkToken);

// POST: /auth/refresh_token
router.post("/refresh_token", authController.refreshToken);

// GET: /auth/user_by_token
router.post("/user_by_token", isAuth, authController.getUserByToken);

module.exports = router;
