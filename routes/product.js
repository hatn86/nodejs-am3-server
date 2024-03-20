const express = require("express");

const productController = require("../controllers/product");

const { isAuth } = require("../middlewares/is-auth");
const { checkRole } = require("../middlewares/check-role");

const { body } = require("express-validator");

const router = express.Router();

// GET: /product
router.get("/", productController.getAll);

// GET: /product:productId
router.get("/detail/:productId", productController.getDetailProduct);

// PUT: /product/cart/add
router.put(
  "/cart/add",
  isAuth,
  [body("quantity").isNumeric().withMessage("Quantity is not valid")],
  productController.addToCart
);

// GET: /product/cart/get
router.get("/cart/get", isAuth, productController.getCart);

// PATCH: /product/cart/update
router.patch(
  "/cart/update",
  isAuth,
  [body("quantity").isNumeric().withMessage("Quantity is not valid")],
  productController.updateCart
);

// DELETE: /product/cart/delete
router.delete("/cart/delete", isAuth, productController.deleteCart);

// POST: /product/filter
router.post("/filter", isAuth, checkRole, productController.filterProduct);

module.exports = router;
