const token = require("../utils/token");

// check valid access token
exports.isAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies["access_token"];
    // valid token
    if (accessToken) {
      try {
        // verify token
        const decodedToken = await token.verifyToken(
          accessToken,
          "access_token"
        );

        req.userId = decodedToken.userId;
        next();
      } catch (err) {
        // expire token
        if (err.name === "TokenExpiredError") {
          console.log("Access token has expired.");
          return res.status(401).json({
            message: "Unauthorized",
            name: "TokenExpiredError",
          });
        }
        // invalid token
        else {
          console.error("Invalid access token:", err.message);
          return res.status(401).json({ message: err.message });
        }
      }
    }
    // none token from request
    else {
      const err = new Error("No token provided");
      err.statusCode = 403;
      throw err;
      // console.error("No token provided");
      // return res.status(200).json({ message: "No token provided", code: 403 });
    }
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
