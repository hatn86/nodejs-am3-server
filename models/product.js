const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  category: {
    type: Schema.Types.String,
    require: true,
  },
  img1: {
    type: Schema.Types.String,
    require: true,
  },
  img2: {
    type: Schema.Types.String,
    require: true,
  },
  img3: {
    type: Schema.Types.String,
    require: true,
  },
  img4: {
    type: Schema.Types.String,
    require: true,
  },
  img5: {
    type: Schema.Types.String,
  },
  long_desc: {
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
  short_desc: {
    type: Schema.Types.String,
    require: true,
  },
  inventory: {
    type: Schema.Types.Number,
    default: 0,
  },
});

module.exports = mongoose.model("Product", productSchema);
