const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const User = require("../models/user");
const Order = require("../models/order");
const Product = require("../models/product");

const { sendEmail } = require("../utils/email");

exports.order = async (req, res, next) => {
  try {
    // validate input
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

    // kiem tra co lay duoc thong tin user hay khong
    const user = await User.findById(req.userId).populate(
      "cart.items.productId"
    );

    if (!user) {
      const err = new Error("You need to login first");
      err.statusCode = 401;
      throw err;
    }

    let totalAmount = 0;

    // loc ra cac san pham co trong cart
    const items = user.cart.items.filter((e) => e.productId);

    if (!items || items.length === 0) {
      const err = new Error("No product in cart");
      err.statusCode = 422;
      throw err;
    }

    // tao new order
    const order = new Order({
      billingDetail: {
        fullName: req.body.fullName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
      },
      user: {
        email: user.email,
        userId: user._id,
      },
      products: items.map((e) => {
        totalAmount += +e.productId.price * +e.quantity;
        return {
          productId: e.productId._id,
          category: e.productId.category,
          img: e.productId.img1,
          name: e.productId.name,
          price: +e.productId.price,
          quantity: e.quantity,
        };
      }),
      totalAmount: 0,
      delivery: 0,
      status: 0,
    });

    order.totalAmount = totalAmount;

    // Bắt đầu một session
    const session = await mongoose.startSession();

    // Thực hiện các thao tác trong session
    session.startTransaction();
    try {
      // duyet tung item trong cart
      // kiem tra so luong ton kho, neu khong du thi sinh loi rollback
      // neu du thi cap nhat so luong ton kho
      for (let i = 0; i < items.length; i++) {
        const product = await Product.findById(items[i].productId._id);

        if (items[i].quantity > product.inventory) {
          const err = new Error(
            `${product.name} not enough quantity. Max: ${product.inventory}`
          );
          err.statusCode = 422;
          throw err;
        } else {
          product.inventory -= items[i].quantity;
          await product.save();
        }
      }

      // luu order vao db
      await order.save();

      // xoa cart
      user.cart.items = [];
      await user.save();

      // Commit transaction
      await session.commitTransaction();
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await session.abortTransaction();
      next(error);
      return;
    } finally {
      session.endSession();
    }

    // gui email don hang da dat
    const mailOption = {
      to: user.email,
      subject: "Confirm order successful",
      html: `
        <h1>Xin chào ${user.fullName}</h1>
        <p>Phone: ${user.phoneNumber}</p>
        <p>Address: ${order.billingDetail.address}</p>
        <table border='1' cellspacing='1' cellpadding='1'>
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Hình ảnh</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
          ${order.products
            .map(
              (p) =>
                `<tr>
              <td style='text-align:center;'>${p.name}</td>
              <td style='text-align:center;'><img src="${p.img}" alt="${
                  p.name
                }" width="150" height="100"></td>
              <td style='text-align:center;'>${p.price.toLocaleString(
                "vi-VN"
              )} VND</td>
              <td style='text-align:center;'>${p.quantity}</td>
              <td style='text-align:center;'>${(
                p.price * p.quantity
              ).toLocaleString("vi-VN")} VND</td>
            </tr>`
            )
            .join("\n")}
          </tbody>
        </table>
        <h2>Tổng thanh toán:</h2>
        <h2>${totalAmount.toLocaleString("vi-VN")} VND</h2>
        <h2>Cảm ơn bạn!</h2>
      `,
    };

    sendEmail(mailOption);

    return res.status(200).json({ message: "Order products successful" });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("You need to login first");
      err.statusCode = 401;
      throw err;
    }

    const orders = await Order.find({ "user.userId": req.userId });

    const delivery = ["Waiting for progressing"];
    const status = ["Waiting for pay"];

    const resOrder = orders.map((o) => {
      return {
        orderId: o._id.toString(),
        userId: o.user.userId,
        name: o.billingDetail.fullName,
        phone: o.billingDetail.phoneNumber,
        address: o.billingDetail.address,
        total: o.totalAmount.toLocaleString("vi-VN") + " VND",
        delivery: delivery[o.delivery],
        status: status[o.status],
      };
    });

    return res.status(200).json({ orders: resOrder });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("You need to login first");
      err.statusCode = 401;
      throw err;
    }

    const order = await Order.findById(req.params.orderId);

    const resOrder = {
      userId: order.user.userId,
      name: order.billingDetail.fullName,
      phone: order.billingDetail.phoneNumber,
      address: order.billingDetail.address,
      total: order.totalAmount.toLocaleString("vi-VN") + " VND",
      products: order.products.map((p) => {
        return {
          productId: p.productId,
          img: p.img,
          name: p.name,
          price: p.price.toLocaleString("vi-VN") + " VND",
          quantity: p.quantity,
        };
      }),
    };

    return res.status(200).json({ order: resOrder });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
