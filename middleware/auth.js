const jwt = require("jsonwebtoken");
const { TOKEN } = require("../config/secure");
const customError = require("../utils/customError");
const userModel = require("../database/userSchema");
const asyncErrorFunction = require("../utils/asyncErrorFunction");

const authUser = asyncErrorFunction(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return next(new customError("Please login", 422, "fail"));
  }
  let sign = jwt.verify(token, TOKEN);
  req.user = await userModel.findById(sign._id);
  req.token = token;
  next();
});

module.exports=authUser;