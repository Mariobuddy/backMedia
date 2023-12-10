const userroute = require("express").Router();
const {
  register,
  login,
  followAndUnfollow,
  Logout,
  updatePassword,
  updateProfile,
  profile,
  deleteUser,
  singleprofile,
  allUser,
  forgotPassword,
  resetPassword,
} = require("../controller/user");
const auth = require("../middleware/auth");

userroute.post("/register", register);
userroute.post("/login", login);
userroute.get("/followandunfollow/:id", auth, followAndUnfollow);
userroute.get("/logout", auth, Logout);
userroute.put("/updatepassword", auth, updatePassword);
userroute.put("/updateprofile", auth, updateProfile);
userroute.get("/profile", auth, profile);
userroute.delete("/deleteuser", auth, deleteUser);
userroute.get("/singleprofile/:id", auth, singleprofile);
userroute.get("/alluser", allUser);
userroute.post("/forgotpassword", forgotPassword);
userroute.patch("/resetpassword/:token", resetPassword);

module.exports = userroute;
