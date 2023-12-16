const mongoose = require("mongoose");
const validator = require("validator");
const customError = require("../utils/customError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { TOKEN } = require("../config/secure");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please Enter Name"],
  },
  surname: {
    type: String,
    require: [true, "Please Enter Surname"],
  },
  email: {
    type: String,
    unique: [true, "Email already exits"],
    required: [true, "Email required"],
    validate(val) {
      if (!validator.isEmail(val)) {
        throw new Error("Email is not valid");
      }
    },
  },
  password: {
    type: String,
    minLength: 8,
    required: true,
  },
  cpassword: {
    type: String,
    minLength: 8,
    // select: false,
    required: true,
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const saltRounds = 8;
      this.password = await bcrypt.hash(this.password, saltRounds);
      this.cpassword = await bcrypt.hash(this.cpassword, saltRounds);
      next();
    } catch (error) {
      return next(new customError("Internal server error", 500, "error"));
    }
  }
});

userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ _id: this._id }, TOKEN);
  this.Tokens = [];
  this.Tokens.push({ token });
  await this.save();
  return token;
};

userSchema.methods.generateResetToken = async function () {
  let Token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(Token)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  await this.save();
  return Token;
};

let userModel = new mongoose.model("user", userSchema);

module.exports = userModel;
