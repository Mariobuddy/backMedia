const postroute = require("express").Router();
const {
  createPost,
  likeAndUnlikePost,
  deletePost,
  getPost,
  updateCaption,
  addOrUpdateComment,
  deleteComment,
} = require("../controller/post");
const auth = require("../middleware/auth");

postroute.post("/createpost", auth, createPost);
postroute.post("/likeunlike/:id", auth, likeAndUnlikePost);
postroute.delete("/deletepost/:id", auth, deletePost);
postroute.get("/getpost", auth, getPost);
postroute.put("/updatecaption/:id", auth, updateCaption);
postroute.put("/addupdatecomment/:id", auth, addOrUpdateComment);
postroute.delete("/deletecomment/:id", auth, deleteComment);

module.exports = postroute;
