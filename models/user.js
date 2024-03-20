const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: {
    type: Schema.Types.String,
    require: true,
  },
  email: {
    type: Schema.Types.String,
    require: true,
  },
  phoneNumber: {
    type: Schema.Types.String,
    require: true,
  },
  password: {
    type: Schema.Types.String,
    require: true,
  },
  role: {
    type: Schema.Types.String,
    require: true,
    // Roles: user - client, admin - client + admin, supporter: client + admin chat
    default: "user",
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          require: true,
        },
        quantity: {
          type: Schema.Types.Number,
          require: true,
        },
      },
    ],
  },
});

module.exports = mongoose.model("User", userSchema);
