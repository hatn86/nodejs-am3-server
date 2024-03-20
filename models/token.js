const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  token: {
    type: Schema.Types.String,
    require: true,
  },
  expireDate: {
    type: Schema.Types.Date,
    require: true,
  },
});

module.exports = mongoose.model("tokens", tokenSchema);
