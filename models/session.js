const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    isEnd: {
      type: Schema.Types.Boolean,
      require: true,
      default: false,
    },
    content: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          require: true,
        },
        text: {
          type: Schema.Types.String,
          require: true,
        },
        type: {
          type: Schema.Types.String,
          require: true,
        },
        time: {
          type: Schema.Types.Date,
          require: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sessions", sessionSchema);
