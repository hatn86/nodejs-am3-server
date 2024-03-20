const express = require("express");
const { body } = require("express-validator");

const orderController = require("../controllers/order");
const { isAuth } = require("../middlewares/is-auth");

const router = express.Router();

// POST: /order
router.post("/", isAuth, orderController.order);

// GET: /order/get
router.get("/get", isAuth, orderController.get);

// GET: /order/:orderId
router.get("/:orderId", isAuth, orderController.getById);

module.exports = router;
