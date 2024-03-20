const { validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");

const User = require("../models/user");
const Token = require("../models/token");

const { create_jwt, verifyToken } = require("../utils/token");

// signup account
exports.signUp = async (req, res, next) => {
  try {
    // result of validation data
    const errors = validationResult(req);

    // throw when error occure
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // get data
    const fullName = req.body.fullName;
    const email = req.body.email;
    const password = req.body.password;
    const tel = req.body.tel;

    // create hash password
    const hashedPass = await bcryptjs.hash(
      password,
      +process.env.BCRYPTJS_HASH_SALT
    );

    // create object user
    const user = new User({
      fullName,
      email,
      password: hashedPass,
      phoneNumber: tel,
    });

    // save user to db
    await user.save();

    return res.status(201).json({ message: "Signup account sucessfull." });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // result of validation data
    const errors = validationResult(req);

    // throw when error occure
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // get data
    const email = req.body.email;
    const password = req.body.password;
    const mode = req.body.mode || "user";

    // tim user bang email
    const user = await User.findOne({
      email: email,
      role: { $in: ["user", "admin", "supporter"] },
    }).populate("cart.items.productId");

    // khong tin thay user thi bao loi
    if (!user) {
      const error = new Error(
        "Authentication failed. Please enter a valid email and password."
      );
      error.statusCode = 401;
      throw error;
    }

    // kiem tra role
    if (
      mode === "admin" &&
      user.role !== "admin" &&
      user.role !== "supporter"
    ) {
      const error = new Error(
        "Authentication failed. Please enter a valid email and password."
      );
      error.statusCode = 401;
      throw error;
    }

    // so sanh mat khau
    const isEqual = await bcryptjs.compare(password, user.password);

    // khong dung mat khau thi bao loi
    if (!isEqual) {
      const error = new Error(
        "Authentication failed. Please enter a valid email and password."
      );
      error.statusCode = 401;
      throw error;
    }

    // tao access token
    const token = create_jwt(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "access_token"
    );

    // tao refresh token
    const refreshToken = create_jwt(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "refresh_token"
    );

    // luu refresh token vao db
    const newToken = new Token({
      token: refreshToken,
      expireDate: new Date(
        Date.now() + +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN
      ),
    });

    const resToken = await newToken.save();

    // day token vao cookie phia client, bao gom:
    // access token
    res.cookie("access_token", token, {
      maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
      httpOnly: true,
      //domain: "hatn86.github.io",
      sameSite: "None",
      secure: true,
    });

    // refresh token
    res.cookie("refresh_token", refreshToken, {
      maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
      httpOnly: true,
      //domain: "hatn86.github.io",
      SameSite: "None",
      secure: true,
    });

    // refresh_token_id luu trong db
    res.cookie("refresh_token_id", resToken._id.toString(), {
      maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
      httpOnly: true,
      //domain: "hatn86.github.io",
      SameSite: "None",
      secure: true,
    });

    return res.status(200).json({
      user: {
        email: user.email,
        userId: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        cart: user.cart.items
          .filter((e) => e.productId)
          .map((e) => {
            return {
              id: e.productId._id,
              name: e.productId.name,
              img: e.productId.img1,
              price: +e.productId.price,
              quantity: e.quantity,
            };
          }),
      },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // xoa access token cookie
    res.cookie("access_token", "none", {
      maxAge: 5000,
      httpOnly: true,
      SameSite: "None",
      secure: true,
    });

    // xoa refresh token cookie
    res.cookie("refresh_token", "none", {
      maxAge: 5000,
      httpOnly: true,
      SameSite: "None",
      secure: true,
    });

    // xoa refresh token id cookie
    res.cookie("refresh_token_id", "none", {
      maxAge: 5000,
      httpOnly: true,
      SameSite: "None",
      secure: true,
    });

    // lay refresh_token_id
    const refresh_token_id = req.cookies["refresh_token_id"];

    // xoa refresh token trong db
    if (refresh_token_id) {
      await Token.findByIdAndDelete(refresh_token_id);
    }

    return res.status(200).json({ message: "Logged out successful!" });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    err.message = "Something went wrong";
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    // lay refresh_token_id
    const refresh_token_id = req.cookies["refresh_token_id"];

    // lay refresh token
    const refresh_token = req.cookies["refresh_token"];

    // kiem tra xem token co duoc luu trong db hay khong
    const token = await Token.findOne({
      _id: refresh_token_id,
      token: refresh_token,
    });

    // khong tim thay token
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
        name: "LoginRequiredError",
      });
    }

    // verify fresh token
    try {
      // valid token
      const decode = await verifyToken(refresh_token, "refresh_token");

      // tao access token
      const access_token = create_jwt(decode, "access_token");

      // tao refresh token
      const refreshToken = create_jwt(decode, "refresh_token");

      // cap nhat refresh token vao db
      token.refreshToken = refreshToken;
      token.expireDate = new Date(
        Date.now() + +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN
      );

      await token.save();

      // day token vao cookie phia client, bao gom:
      // access token
      res.cookie("access_token", access_token, {
        maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
        httpOnly: true,
        //domain: "hatn86.github.io",
        SameSite: "None",
        secure: true,
      });

      // refresh token
      res.cookie("refresh_token", refreshToken, {
        maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
        httpOnly: true,
        //domain: "hatn86.github.io",
        SameSite: "None",
        secure: true,
      });

      // refresh_token_id luu trong db
      res.cookie("refresh_token_id", token._id.toString(), {
        maxAge: +process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN,
        httpOnly: true,
        //domain: "hatn86.github.io",
        SameSite: "None",
        secure: true,
      });

      return res.status(200).json({ message: "Generate token successful" });
    } catch (err) {
      // expire token
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token has expired.");

        // xoa token ra khoi db
        await Token.findByIdAndDelete(refresh_token_id);

        return res.status(401).json({
          message: "Unauthorized",
          name: "LoginRequiredError",
        });
      }
      // invalid token
      else {
        console.error("Invalid access token:", err.message);
        return res.status(401).json({ message: err.message });
      }
    }
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    err.message = "Something went wrong";
    next(err);
  }
};

exports.checkToken = (req, res, next) => {
  return res.status(200).json({ message: "Token is valid" });
};

exports.getUserByToken = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(200).json({ user: {} });
    }

    // get user from db
    const user = await User.findById(req.userId).populate(
      "cart.items.productId"
    );

    return res.status(200).json({
      user: {
        email: user.email,
        userId: user._id.toString(),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        cart: user.cart.items
          .filter((e) => e.productId)
          .map((e) => {
            return {
              id: e.productId._id,
              name: e.productId.name,
              img: e.productId.img1,
              price: +e.productId.price,
              quantity: e.quantity,
            };
          }),
      },
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    err.message = "Something went wrong";
    next(err);
  }
};
