const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");

const Order = require("../models/order");
const Product = require("../models/product");

exports.dashboard = async (req, res, next) => {
  try {
    // lay danh sach don dat hang
    const orders = await Order.find();

    // lay danh sach user dat hang
    const users = orders.map((o) => {
      return o.user.userId;
    });

    // tao danh sach unique user;
    const uniqueUser = [...new Set([...users])];

    // lay ngay dat hang nho nhat, lon nhat
    const orderDate = orders.map((o) => o.createdAt);

    // ngay dat hang nho nhat
    const minDate = new Date(Math.min(...orderDate)),
      // ngay dat hang lon nhat hoac la ngay hien tai
      maxDate =
        Math.max(...orderDate) < new Date()
          ? new Date()
          : new Date(Math.max(...orderDate));

    // tinh so thang chenh lech
    const countMonth = Math.abs(
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth() + 1)
    );

    // tinh tong doanh thu
    const totalAmount = orders.reduce((sum, cur) => {
      return sum + cur.totalAmount;
    }, 0);

    // tinh trung binh hang thang
    const balance = parseInt(totalAmount / countMonth);

    // danh sach trang thai giao hang, tinh trang don hang
    const delivery = ["Waiting for progressing"];
    const status = ["Waiting for pay"];

    // lay danh sach 10 don hang gan nhat
    const sortedOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map((o) => {
        return {
          _id: o._id,
          userId: o.user.userId,
          name: o.billingDetail.fullName,
          phone: o.billingDetail.phoneNumber,
          address: o.billingDetail.address,
          totalAmount: o.totalAmount.toLocaleString("vi-VN"),
          delivery: delivery[o.delivery],
          status: status[o.status],
        };
      });

    return res.status(200).json({
      result: {
        totalUsers: uniqueUser.length,
        totalOrders: orders.length,
        totalEarnings: totalAmount,
        balance: balance.toLocaleString("vi-VN"),
        orders: sortedOrders,
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// them moi product
exports.productAdd = async (req, res, next) => {
  try {
    // check validator errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join("\n")
      );
      err.statusCode = 422;
      throw err;
    }

    // check images upload
    if (req.files.length === 0) {
      const err = new Error("No image provided");
      err.statusCode = 422;
      throw err;
    }

    // chuan bi du lieu
    const name = req.body.name;
    const category = req.body.category;
    const short_desc = req.body.short_desc;
    const long_desc = req.body.long_desc;
    const price = req.body.price;

    const product = new Product({
      name,
      category,
      short_desc,
      long_desc,
      price,
    });

    // lay danh sach image, toi da 5 images
    const files = req.files;
    const n = Math.min(files.length, 5);

    for (let i = 0; i < n; i++) {
      let path = files[i].path.replace("\\", "/").trim();
      path =
        process.env.ADDRESS +
        (process.env.PORT ? ":" + process.env.PORT : "") +
        "/" +
        path;
      product["img" + (i + 1)] = path;
    }

    // luu du lieu vao db
    const newProduct = await product.save();

    return res.status(201).json({
      message: "Add new product successful!",
      productId: newProduct._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// cap nhat product
exports.productUpdate = async (req, res, next) => {
  try {
    // check validator errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error(
        errors
          .array()
          .map((e) => e.msg)
          .join("\n")
      );
      err.statusCode = 422;
      throw err;
    }

    // kiem tra xem co ton tai product hay khong
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
      const err = new Error("No product found");
      err.statusCode = 422;
      throw err;
    }

    // chuan bi du lieu
    product.name = req.body.name;
    product.category = req.body.category;
    product.short_desc = req.body.short_desc;
    product.long_desc = req.body.long_desc;
    product.price = req.body.price;

    // luu du lieu vao db
    await product.save();

    return res.status(200).json({
      message: "Update product successful!",
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// xoa product
exports.productDelete = async (req, res, next) => {
  try {
    // kiem tra xem co ton tai product hay khong
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
      const err = new Error("No product found");
      err.statusCode = 422;
      throw err;
    }

    // xoa image khoi server
    const http =
      process.env.ADDRESS +
      (process.env.PORT ? ":" + process.env.PORT : "") +
      "/";

    if (product.img1) {
      clearImage(product.img1.replace(http, "").replace("/", "\\"));
    }
    if (product.img2) {
      clearImage(product.img2.replace(http, "").replace("/", "\\"));
    }
    if (product.img3) {
      clearImage(product.img3.replace(http, "").replace("/", "\\"));
    }
    if (product.img4) {
      clearImage(product.img4.replace(http, "").replace("/", "\\"));
    }
    if (product.img5) {
      clearImage(product.img5.replace(http, "").replace("/", "\\"));
    }

    // xoa du lieu khoi db
    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      message: "Delete product successful!",
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) console.log(err);
  });
};
