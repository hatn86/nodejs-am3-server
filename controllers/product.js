const { validationResult } = require("express-validator");

const Product = require("../models/product");
const User = require("../models/user");

// lay toan bo product
exports.getAll = async (req, res, next) => {
  try {
    const category = req.query.category || "all";

    const products = await Product.find(
      category === "all" ? {} : { category: category }
    );

    return res.status(200).json({ products });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// lay thong tin product theo id
exports.getDetailProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    //if (!product.inventory) product.inventory = 0;

    // tim danh sach san pham cung cate nhung tru san pham can xem
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    });

    return res.status(200).json({ product, relatedProducts });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// them product vao cart
exports.addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join("/n")
      );
      error.statusCode = 422;
      throw error;
    }

    const productId = req.body.productId;
    const quantity = +req.body.quantity;

    const user = await User.findById(req.userId);

    if (!user) {
      const err = new Error("You need to login first.");
      err.statusCode = 401;
      throw err;
    }

    // kiem tra xem san pham da co trong cart hay chua
    // neu chua thi them moi, neu co thi cong them so luong
    let index = user.cart.items.findIndex(
      (e) => e.productId.toString() === productId
    );

    if (index === -1) {
      user.cart.items.push({ productId, quantity });
      index = user.cart.items.length - 1;
    } else {
      user.cart.items[index].quantity += quantity;
    }

    const totalQuantity = user.cart.items[index].quantity;

    // kiem tra xem product co ton tai khong
    const product = await Product.findById(productId);

    if (!product) {
      const err = new Error("Could not found product.");
      err.statusCode = 422;
      throw err;
    }

    if (totalQuantity > product.inventory) {
      const err = new Error("Not enough quantity. Max: " + product.inventory);
      err.statusCode = 422;
      throw err;
    }

    await user.save();

    return res.status(200).json({
      message: "Add product to cart successful.",
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// lay toan bo thong tin cart
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate(
      "cart.items.productId"
    );

    if (!user) {
      const err = new Error("You need to login first.");
      err.statusCode = 401;
    }

    return res.status(200).json({
      cart: user.cart.items
        .filter((e) => e.productId)
        .map((e) => {
          return {
            id: e.productId._id,
            name: e.productId.name,
            img: e.productId.img1,
            price: +e.productId.price,
            quantity: e.quantity,
            inventory: e.productId.inventory,
            message:
              e.productId.inventory < e.quantity
                ? "Not enough quantity. Max: " + e.productId.inventory
                : "",
          };
        }),
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// cap nhat cart
exports.updateCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join("/n")
      );
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const err = new Error("You need to login first.");
      err.statusCode = 401;
      throw err;
    }

    const productId = req.body.productId;
    const quantity = +req.body.quantity;

    // kiem tra xem san pham co ton tai trong cart hay khong
    // neu khong thi bao loi
    // neu co thi cap nhat so luong
    const index = user.cart.items.findIndex(
      (e) => e.productId.toString() === productId
    );

    if (index === -1) {
      const err = new Error("Product does not exists.");
      err.statusCode = 404;
      throw err;
    }

    // Lay so luong ton kho cua san pham
    const product = await Product.findById(productId);

    const inventory = product.inventory || 0;

    if (user.cart.items[index].quantity < quantity && quantity > inventory) {
      const err = new Error("Not enough quantity. Max: " + product.inventory);
      err.statusCode = 422;
      throw err;
    }

    user.cart.items[index].quantity = quantity;

    await user.save();

    return res.status(200).json({ message: "Update cart successful." });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// xao san phan ra khoi cart
exports.deleteCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const err = new Error("You need to login first.");
      err.statusCode = 401;
      throw err;
    }

    const productId = req.body.productId;

    // kiem tra xem san pham co ton tai trong cart hay khong
    // neu khong thi bao loi
    // neu co thi cap nhat so luong
    const index = user.cart.items.findIndex(
      (e) => e.productId.toString() === productId
    );

    if (index !== -1) {
      user.cart.items.splice(index, 1);

      await user.save();
    }

    return res.status(200).json({ message: "Delete product successful." });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Filter product with condition
exports.filterProduct = async (req, res, next) => {
  try {
    const name = req.body.name || "";
    const regex = new RegExp(name, "i");
    const products = await Product.find({ name: { $regex: regex } });

    return res.status(200).json({ products });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
