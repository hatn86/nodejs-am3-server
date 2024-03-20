const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    billingDetail: {
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
      address: {
        type: Schema.Types.String,
        require: true,
      },
    },
    user: {
      email: {
        type: Schema.Types.String,
        require: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
      },
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          require: true,
        },
        category: {
          type: Schema.Types.String,
          require: true,
        },
        img: {
          type: Schema.Types.String,
          require: true,
        },
        name: {
          type: Schema.Types.String,
          require: true,
        },
        price: {
          type: Schema.Types.Number,
          require: true,
        },
        quantity: {
          type: Schema.Types.Number,
          require: true,
        },
      },
    ],
    totalAmount: {
      type: Schema.Types.Number,
      require: true,
    },
    delivery: {
      type: Schema.Types.Number,
      require: true,
      default: 0,
    },
    status: {
      type: Schema.Types.Number,
      require: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Orders", orderSchema);
