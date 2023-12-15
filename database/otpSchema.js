const mongoose = require("mongoose");
const validator = require("validator");

const otpSchema = new mongoose.Schema({
  otp: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email required"],
    validate(val) {
      if (!validator.isEmail(val)) {
        throw new Error("Email is not valid");
      }
    },
  },
});

let otpModel = new mongoose.model("otp", otpSchema);

module.exports = otpModel;
