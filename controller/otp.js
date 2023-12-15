const asyncErrorHandling = require("../utils/asyncErrorFunction");
const customError = require("../utils/customError");
const otpModel = require("../database/otpSchema");
const sendEmail = require("../utils/email");

// ---------------------------------------------Send Otp---------------------------------------------

const sendOtp = asyncErrorHandling(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new customError("All Fields are required", 422, "fail"));
  }

  const existingOtpData = await otpModel.findOne({ email });

  let message = `Your otp code is ${otp}`;

  if (existingOtpData) {
    existingOtpData.otp = otp;
    await existingOtpData.save();
    message = `Your otp code has been updated to ${otp}`;
  } else {
    const otpData = new otpModel({ email, otp });
    await otpData.save();
  }

  await sendEmail({
    email,
    subject: "Otp request received",
    message,
  });

  return res
    .status(200)
    .json({ success: true, message: "Otp sent successfully" });
});

// -------------------------------------------------Send Otp End----------------------------------------

module.exports = { sendOtp };
