const postModel = require("../database/postSchema");
const asyncErrorHandling = require("../utils/asyncErrorFunction");
const customError = require("../utils/customError");
const userModel = require("../database/userSchema");
const cloudinary = require("cloudinary");

// ---------------------------------Create Post--------------------------------------------------------------
const createPost = asyncErrorHandling(async (req, res, next) => {
  const { image, caption } = req.body;
  if (!image && !caption) {
    return next(new customError("All Fields are required", 422, "fail"));
  }
  const myCloud = await cloudinary.v2.uploader.upload(image);
  const newUserPost = {
    caption: caption,
    image: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
    owner: req.user._id,
  };
  let postData = await postModel.create(newUserPost);

  let user = await userModel.findById(req.user._id);
  user.posts.push(postData._id);
  await postData.save();
  await user.save();
  res.status(200).json({ sucess: true, postData });
});
// ---------------------------------Create Post End---------------------------------------------------------

// ---------------------------------Like And Unlike---------------------------------------------------------

const likeAndUnlikePost = asyncErrorHandling(async (req, res, next) => {
  const post = await postModel.findById(req.params.id);

  if (post.likes.includes(req.user._id)) {
    let index = post.likes.indexOf(req.user._id);
    post.likes.splice(index, 1);
    await post.save();
    res.status(200).json({ sucess: true, message: "Unlike" });
  } else {
    post.likes.push(req.user._id);
    await post.save();
    res.status(200).json({ sucess: true, message: "Like" });
  }
});

// ---------------------------------Like And Unlike-----------------------------------------------------

// ---------------------------------Delete Post-----------------------------------------------------

const deletePost = asyncErrorHandling(async (req, res, next) => {
  let post = await postModel.findById(req.params.id);
  if (!post) {
    return next(new customError("Post Not Found", 400, "fail"));
  }
  let user = await userModel.findById(req.user._id);
  if (post.owner.toString() !== user._id.toString()) {
    return next(new customError("Unauthorized User", 401, "fail"));
  }
  let index = user.posts.indexOf(req.params.id);
  user.posts.splice(index, 1);
  await post.deleteOne();
  await user.save();
  res.status(200).json({ sucess: true, post });
});

// ---------------------------------Delete Post End-----------------------------------------------------

// -----------------------------------Get Post------------------------------------------------------

const getPost = asyncErrorHandling(async (req, res, next) => {
  let user = await userModel.findById(req.user._id);
  let post = await postModel.find({ owner: { $in: user.following } });

  res.status(200).json({ sucess: true, post });
});

// -----------------------------------Get Post End--------------------------------------------------

// -----------------------------------Update Caption--------------------------------------------------

const updateCaption = asyncErrorHandling(async (req, res, next) => {
  if (!req.body.caption) {
    return next(new customError("Nothing to update", 422, "fail"));
  }
  let post = await postModel.findById(req.params.id);
  if (!post) {
    return next(new customError("Post Not Found", 400, "fail"));
  }
  let user = await userModel.findById(req.user._id);
  if (post.owner.toString() !== user._id.toString()) {
    return next(new customError("Unauthorized User", 401, "fail"));
  }

  post.caption = req.body.caption;
  await post.save();
  res.status(200).json({ sucess: true, post });
});

// -----------------------------------Update Caption End----------------------------------------------

// -----------------------------------Add Or Update Comment---------------------------------------------

const addOrUpdateComment = asyncErrorHandling(async (req, res, next) => {
  const post = await postModel.findById(req.params.id);
  if (!post) {
    return next(new customError("Post Not Found", 400, "fail"));
  }

  let commentIndex = -1;

  post.comment.forEach((val, index) => {
    if (val.user.toString() === req.user._id.toString()) {
      return (commentIndex = index);
    }
  });

  if (commentIndex !== -1) {
    post.comment[commentIndex].comment = req.body.comment;
    await post.save();
    res.status(200).json({ sucess: true, message: "Comment Updated" });
  } else {
    post.comment.push({
      user: req.user._id,
      comment: req.body.comment,
    });
    await post.save();
    res.status(200).json({ sucess: true, message: "Comment Added" });
  }
});

// --------------------------------Add Or Update Comment End-------------------------------------------

// --------------------------------Delete Comment-----------------------------------------------------

const deleteComment = asyncErrorHandling(async (req, res, next) => {
  if (!req.body.commentId) {
    return next(new customError("Comment id is required", 422, "fail"));
  }
  const post = await postModel.findById(req.params.id);
  if (!post) {
    return next(new customError("Post Not Found", 400, "fail"));
  }

  if (post.owner.toString() === req.user._id) {
    post.comment.forEach((val, index) => {
      if (val.user.toString() === req.body.commentId.toString()) {
        return post.comment.splice(index, 1);
      }
    });
    await post.save();
    res.status(200).json({ sucess: true, message: "Others Comment Deleted" });
  } else {
    post.comment.forEach((val, index) => {
      if (val.user.toString() === req.user._id.toString()) {
        return post.comment.splice(index, 1);
      }
    });
    await post.save();
    res.status(200).json({ sucess: true, message: "My Comment Deleted" });
  }
});

// --------------------------------Delete Comment End-------------------------------------------------

module.exports = {
  createPost,
  likeAndUnlikePost,
  deletePost,
  getPost,
  updateCaption,
  addOrUpdateComment,
  deleteComment,
};
