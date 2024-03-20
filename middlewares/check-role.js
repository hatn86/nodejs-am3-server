const User = require("../models/user");

exports.checkRole = async (req, res, next) => {
  try {
    const mode = req.body.mode || "";
    const userId = req.userId;

    const user = await User.findById(userId);

    // khong tim thay thong tin user
    if (!user) {
      const err = new Error("Not Authenticated");
      err.statusCode = 401;
      throw err;
    }
    // mode user nhung role cua user khong thoa man
    else if (
      mode === "user" &&
      user.role !== "user" &&
      user.role !== "supporter" &&
      user.role !== "admin"
    ) {
      const err = new Error("Not Authorized");
      err.statusCode = 401;
      throw err;
    }
    // mode supporter nhung role cua user khong thoa man
    else if (
      mode === "supporter" &&
      user.role !== "supporter" &&
      user.role !== "admin"
    ) {
      const err = new Error("Not Authorized");
      err.statusCode = 401;
      throw err;
    }
    // mode admin nhung role cua user khong thoa man
    else if (mode === "admin" && user.role !== "admin") {
      const err = new Error("Not Authorized");
      err.statusCode = 401;
      throw err;
    }

    next();
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
