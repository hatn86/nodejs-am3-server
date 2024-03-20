const jwt = require("jsonwebtoken");

// Get secret key and expire time for access or refresh token
const getSecretKeyTimes = (type) => {
  const secret_key =
    type === "access_token"
      ? process.env.JSON_WEB_TOKEN_SECRET_KEY
      : process.env.JSON_WEB_REFRESH_TOKEN_SECRET_KEY;

  const expiresTime =
    type === "access_token"
      ? process.env.JSON_WEB_TOKEN_EXPIRESIN
      : process.env.JSON_WEB_REFRESH_TOKEN_EXPIRESIN;

  return { secret_key, expiresTime };
};

// generate access/refresh token
exports.create_jwt = (payload, type) => {
  const { secret_key, expiresTime } = getSecretKeyTimes(type);

  return jwt.sign(payload, secret_key, {
    expiresIn: +expiresTime,
  });
};

// verify access/refresh token
exports.verifyToken = (token, type) => {
  const { secret_key } = getSecretKeyTimes(type);

  //return jwt.verify(token, secret_key);

  return new Promise((resolve, reject) => {
    jwt.verify(token, secret_key, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
};
