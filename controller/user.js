const userModel = require("../database/userSchema");
const otpModel = require("../database/otpSchema");
const customError = require("../utils/customError");
const asyncErrorHandling = require("../utils/asyncErrorFunction");
const cloudinary = require("cloudinary");
const NodeCache = require("node-cache");
const bcrypt = require("bcrypt");
const postModel = require("../database/postSchema");
const base_url = require("../config/base_url");
const crypto = require("crypto");
let mycache = new NodeCache({
  stdTTL: 60,
});
const sendEmail = require("../utils/email");

// -------------------------------Registrstion-----------------------------------------------

const register = asyncErrorHandling(async (req, res, next) => {
  const { name, surname, email, password, cpassword, avatar, otp } = req.body;
  if (
    !name ||
    !surname ||
    !email ||
    !password ||
    !cpassword ||
    !avatar ||
    !otp
  ) {
    return next(new customError("All Fields are required", 422, "fail"));
  }
  const myCloud = await cloudinary.v2.uploader.upload(avatar);

  const preUser = await userModel.findOne({ email: email });

  const otpData = await otpModel.findOne({ email });

  if (preUser) {
    return next(new customError("Email already exists", 422, "fail"));
  }

  if (password !== cpassword) {
    return next(new customError("Passwords do not match", 422, "fail"));
  }

  if (otpData) {
    if (otpData.otp != otp) {
      return next(new customError("Otp is wrong", 422, "fail"));
    }
  }
  const userData = new userModel({
    name,
    surname,
    password,
    cpassword,
    email,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  await userData.save();

  return res
    .status(200)
    .json({ sucess: true, message: "Registration sucessfull" });
});

// -------------------------------Registrstion End-----------------------------------------------

// -----------------------------------Login-----------------------------------------------

let login = asyncErrorHandling(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new customError("Email and password are required", 422, "fail")
    );
  }

  const userData = await userModel.findOne({ email: email });

  if (!userData) {
    return next(new customError("Email not found", 422, "fail"));
  }

  const isMatch = await bcrypt.compare(password, userData.password);

  if (!isMatch) {
    return next(new customError("Password does not match", 422, "fail"));
  }

  const token = await userData.generateAuthToken();

  res.cookie("jwt", token, {
    httpOnly: false,
    secure: false,
  });
  return res.status(200).json({ sucess: true, token });
});
// -----------------------------------Login End----------------------------------------------------------

// ---------------------------------Follow And Unfollow-----------------------------------------------------

const followAndUnfollow = asyncErrorHandling(async (req, res, next) => {
  let otheruser = await userModel.findById(req.params.id);
  let user = await userModel.findById(req.user._id);

  if (!otheruser) {
    return next(new customError("User Not Found", 400, "fail"));
  }

  if (user.following.includes(otheruser._id)) {
    let otherIndex = otheruser.followers.indexOf(user._id);
    let index = user.following.indexOf(otheruser._id);
    user.following.splice(index, 1);
    otheruser.followers.splice(otherIndex, 1);
    await user.save();
    await otheruser.save();
    res.status(200).json({ sucess: true, message: "Unfollowed" });
  } else {
    user.following.push(otheruser._id);
    otheruser.followers.push(user._id);
    await user.save();
    await otheruser.save();
    res.status(200).json({ sucess: true, message: "Followed" });
  }
});

// ---------------------------------Follow And Unfollow End---------------------------------------------

// -----------------------------------------Logout------------------------------------------------------

let Logout = asyncErrorHandling(async (req, res, next) => {
  res.clearCookie("jwt");
  res.status(200).json({ sucess: true, message: "Logout" });
});
// -----------------------------------------Logout End--------------------------------------------------

// -----------------------------------------Update Password-----------------------------------------------

const updatePassword = asyncErrorHandling(async (req, res, next) => {
  const { currentpassword, newpassword, cnewpassword } = req.body;
  if (!currentpassword || !newpassword || !cnewpassword) {
    return next(new customError("Nothing to update", 422, "fail"));
  }
  let userData = await userModel.findOne(req.user._id);
  const isMatch = await bcrypt.compare(currentpassword, userData.password);
  if (!isMatch) {
    return next(new customError("Password is incorrect", 422, "fail"));
  }
  if (newpassword !== cnewpassword) {
    return next(new customError("Passwords do not match", 422, "fail"));
  }
  userData.password = newpassword;
  userData.cpassword = cnewpassword;
  await userData.save();
  const token = await userData.generateAuthToken();
  res.cookie("jwt", token, {
    httpOnly: false,
    secure: false,
  });
  return res.status(200).json({ sucess: true, token });
});
// -----------------------------------------Update Password End ------------------------------------------

// -----------------------------------------Update Profile ----------------------------------------------

const updateProfile = asyncErrorHandling(async (req, res, next) => {
  const { name, surname, email, avatar } = req.body;
  if (!name || !surname || !email || !avatar) {
    return next(new customError("Nothing to update", 422, "fail"));
  }

  const myCloud = await cloudinary.v2.uploader.upload(avatar);
  const imgUser = await userModel.findById(req.user._id);
  if (avatar && imgUser.avatar.public_id !== myCloud.public_id) {
    await cloudinary.v2.uploader.destroy(imgUser.avatar.public_id);
  }
  let userMain = await userModel.findById(req.user._id);
  if (userMain.email !== email) {
    return next(new customError("Email already exists", 422, "fail"));
  }
  let user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      name,
      surname,
      email,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  return res.status(200).json({ sucess: true, user });
});

// -----------------------------------------Update Profile End ------------------------------------------

// -----------------------------------------Profile --------------------------------------------------

const profile = asyncErrorHandling(async (req, res, next) => {
  let user = await userModel.findOne(req.user._id).populate("posts");
  if (!user) {
    return next(new customError("Invalid email", 422, "fail"));
  }
  res.status(200).json({ sucess: true, user });
});
// -----------------------------------------Profile End -------------------------------------------------

// -----------------------------------------Delete Profile-----------------------------------------------

const deleteUser = asyncErrorHandling(async (req, res, next) => {
  let user = await userModel.findById(req.user._id);

  for (let i = 0; i < user.followers.length; i++) {
    let followingUser = await userModel.findById(user.followers[i]);
    let index = followingUser.following.indexOf(req.user._id);
    followingUser.following.splice(index, 1);
    await followingUser.save();
  }
  for (let i = 0; i < user.following.length; i++) {
    let followersUser = await userModel.findById(user.following[i]);
    let index = followersUser.followers.indexOf(req.user._id);
    followersUser.followers.splice(index, 1);
    await followersUser.save();
  }

  for (let i = 0; i < user.posts.length; i++) {
    let post = await postModel.findById(user.posts[i]);
    await post.deleteOne();
  }
  await user.deleteOne();
  res.clearCookie("jwt");
  res.status(200).json({ sucess: true, user });
});

// -----------------------------------------Delete Profile End -------------------------------------------

// ----------------------------------------- Single User ------------------------------------------------

const singleprofile = asyncErrorHandling(async (req, res, next) => {
  let user = await userModel.findById(req.params.id).populate("posts");
  if (!user) {
    return next(new customError("Invalid email", 422, "fail"));
  }
  res.status(200).json({ sucess: true, user });
});

// -----------------------------------------Single User End ---------------------------------------------

// -----------------------------------------All User --------------------------------------------------

const allUser = asyncErrorHandling(async (req, res, next) => {
  let user = await userModel.find({});
  res.status(200).json({ sucess: true, user });
});

// -----------------------------------------All User End ---------------------------------------------

// --------------------------------Forgot Password--------------------------------------------------

const forgotPassword = asyncErrorHandling(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new customError("Enter your email", 422, "fail"));
  }
  let forgotEmail = await userModel.findOne({ email: email });
  if (!forgotEmail) {
    return next(new customError("Email not found", 404, "fail"));
  }
  let resetToken = await forgotEmail.generateResetToken();
  let reqPath = `${base_url}/resetpassword/${resetToken}`;
  const message = `we have received a password reset request.Please use the below link to reset your password\n\n${reqPath}`;
  try {
    await sendEmail({
      email: forgotEmail.email,
      subject: "Password change request received",
      message: message,
    });
    res.status(200).json({
      status: "sucess",
      message: "password reset link send to the user email",
      token: resetToken,
    });
  } catch (error) {
    forgotEmail.passwordResetToken = undefined;
    forgotEmail.passwordResetTokenExpires = undefined;
    await forgotEmail.save();
    return next(
      new customError(
        "There was an error sending password request email",
        500,
        "error"
      )
    );
  }
});
// --------------------------------Forgot Password End-----------------------------------------------

// --------------------------------Reset Password---------------------------------------------------

const resetPassword = asyncErrorHandling(async (req, res, next) => {
  const { password, cpassword } = req.body;
  if (!password || !cpassword) {
    return next(new customError("All fields are required", 422, "fail"));
  }
  let encrypt = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  let user = await userModel.findOne({
    passwordResetToken: encrypt,
    passwordResetTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new customError("Token is invalid or has expired", 404, "fail")
    );
  }
  if (password !== cpassword) {
    return next(new customError("Password is not matching", 400, "fail"));
  }
  user.password = password;
  user.cpassword = cpassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = Date.now();
  await user.save();
  return res.status(200).json({ sucess: true, user });
});

// --------------------------------Reset Password End------------------------------------------------

module.exports = {
  register,
  profile,
  login,
  followAndUnfollow,
  Logout,
  updatePassword,
  updateProfile,
  deleteUser,
  allUser,
  singleprofile,
  forgotPassword,
  resetPassword,
};
