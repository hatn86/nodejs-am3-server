const express = require("express");
const { body } = require("express-validator");

const orderController = require("../controllers/order");
const { isAuth } = require("../middlewares/is-auth");

const router = express.Router();

// POST: /order
router.post(
  "/",
  isAuth,
  [
    body("fullName")
      .isLength({ min: 1 })
      .withMessage("Full name cannot be empty"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail(),
    body("phoneNumber")
      .trim()
      .isEmpty()
      .withMessage("Phone number cannot be empty.")
      .custom((val) => {
        // Vietnamese phone number format
        const vnTel_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
        return vnTel_regex.test(val);
      })
      .withMessage("Please enter a valid phone number."),
    body("address").isLength({ min: 1 }).withMessage("Address cannot be empty"),
  ],
  orderController.order
);

// GET: /order/get
router.get("/get", isAuth, orderController.get);

// GET: /order/:orderId
router.get("/:orderId", isAuth, orderController.getById);

module.exports = router;
