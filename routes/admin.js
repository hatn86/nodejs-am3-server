const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");

const { isAuth } = require("../middlewares/is-auth");
const { checkRole } = require("../middlewares/check-role");

const router = express.Router();

// POST: /admin/dashboard
router.post("/dashboard", isAuth, checkRole, adminController.dashboard);

// POST: /admin/product/add
router.post(
  "/product/add",
  isAuth,
  checkRole,
  [
    body("name").isLength({ min: 1 }).withMessage("Name cannot be empty"),
    body("category")
      .isLength({ min: 1 })
      .withMessage("Category cannot be empty"),
    body("short_desc")
      .isLength({ min: 1 })
      .withMessage("Short description cannot be empty"),
    body("long_desc")
      .isLength({ min: 1 })
      .withMessage("Long description cannot be empty"),
    body("price").isNumeric().withMessage("Price must be number"),
  ],
  adminController.productAdd
);

// PUT: /admin/product/:productId
router.put(
  "/product/:productId",
  isAuth,
  checkRole,
  [
    body("name").isLength({ min: 1 }).withMessage("Name cannot be empty"),
    body("category")
      .isLength({ min: 1 })
      .withMessage("Category cannot be empty"),
    body("short_desc")
      .isLength({ min: 1 })
      .withMessage("Short description cannot be empty"),
    body("long_desc")
      .isLength({ min: 1 })
      .withMessage("Long description cannot be empty"),
    body("price").isNumeric().withMessage("Price must be number"),
  ],
  adminController.productUpdate
);

// DELETE /admin/product/delete/:productId
router.delete(
  "/product/delete/:productId",
  isAuth,
  checkRole,
  adminController.productDelete
);

module.exports = router;
