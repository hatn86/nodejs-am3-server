let upload;

module.exports = {
  init: (opt) => {
    upload = require("multer")(opt);
    return upload;
  },
  get: () => {
    if (!upload) {
      throw new Error("Multer is not initialized!");
    }
    return upload;
  },
};
